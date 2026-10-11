import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription, tap } from 'rxjs';

import {
  EmptyStateAction,
  EmptyStateComponent,
} from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { FormModalComponent } from '~/app/common/components/form-modal/form-modal.component';
import type { AppI18n } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { ToastService } from '~/app/common/services/toast.service';
import { AdjustmentFormComponent } from '~/app/features/quick-add/components/adjustment-form/adjustment-form.component';
import { CardPurchaseFormComponent } from '~/app/features/quick-add/components/card-purchase-form/card-purchase-form.component';
import { CashEntryFormComponent } from '~/app/features/quick-add/components/cash-entry-form/cash-entry-form.component';
import { DebtEntryComponent } from '~/app/features/quick-add/components/debt-entry/debt-entry.component';
import { InvestmentFormComponent } from '~/app/features/quick-add/components/investment-form/investment-form.component';
import { LoanFormComponent } from '~/app/features/quick-add/components/loan-form/loan-form.component';
import { ModeSwitchComponent } from '~/app/features/quick-add/components/mode-switch/mode-switch.component';
import {
  ReceivableOption,
  ReceivedFormComponent,
} from '~/app/features/quick-add/components/received-form/received-form.component';
import { RefundFormComponent } from '~/app/features/quick-add/components/refund-form/refund-form.component';
import { TransferFormComponent } from '~/app/features/quick-add/components/transfer-form/transfer-form.component';
import { loadFormOptions } from '~/app/features/quick-add/form-options';
import {
  DEFAULT_MODE,
  parseMode,
  PEOPLE_DATA_MODES,
  QuickAddMode,
} from '~/app/features/quick-add/quick-add-mode';
import { sanitizeSharedText } from '~/app/features/quick-add/quick-add-params';
import { transactionLabel } from '~/app/features/transactions/transaction-label';
import { AccountsListFacade } from '~/modules/accounts/core/facades/accounts-list.facade';
import type { Account } from '~/modules/accounts/core/types/account';
import { CardsListFacade } from '~/modules/cards/core/facades/cards-list.facade';
import { PurchasePreviewFacade } from '~/modules/cards/core/facades/purchase-preview.facade';
import type { Card } from '~/modules/cards/core/types/card';
import { CategoriesFacade } from '~/modules/categories/core/facades/categories.facade';
import type { Category } from '~/modules/categories/core/types/category';
import { DebtsListFacade } from '~/modules/debts/core/facades/debts-list.facade';
import type { Debt } from '~/modules/debts/core/types/debt';
import { PeopleListFacade } from '~/modules/people/core/facades/people-list.facade';
import { RefundOriginSearchFacade } from '~/modules/transactions/core/facades/refund-origin-search.facade';
import { TransactionFormFacade } from '~/modules/transactions/core/facades/transaction-form.facade';
import type { Transaction } from '~/modules/transactions/core/types/transaction';
import type { PaymentMethod } from '~/modules/transactions/core/types/transaction-enums';
import type { TransactionInput } from '~/modules/transactions/core/types/transaction-input';
import { Problem, problemOf } from '~/util/api/problem';
import { isOpenStatus, type PersonRef } from '~/util/debt';
import { counterpartyName } from '~/util/debt-name';
import { readLastUsedAccount, writeLastUsedAccount } from '~/util/last-used-account';
import { readLastUsedCard, writeLastUsedCard } from '~/util/last-used-card';
import { formatMoney } from '~/util/money';

type LoadState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready' };

function accountOf(input: TransactionInput): string {
  switch (input.type) {
    case 'TRANSFER':
      return input.fromAccountId;
    case 'INVESTMENT':
      return input.cashAccountId;
    case 'CARD_PURCHASE':
      return '';
    case 'REFUND':
      return input.accountId ?? '';
    default:
      return input.accountId;
  }
}

function cardOf(input: TransactionInput): string | null {
  return input.type === 'CARD_PURCHASE' ? input.cardId : null;
}

@Component({
  selector: 'app-quick-add-page',
  imports: [
    FormModalComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ModeSwitchComponent,
    CashEntryFormComponent,
    TransferFormComponent,
    InvestmentFormComponent,
    AdjustmentFormComponent,
    RefundFormComponent,
    CardPurchaseFormComponent,
    LoanFormComponent,
    ReceivedFormComponent,
    DebtEntryComponent,
  ],
  providers: [
    TransactionFormFacade,
    AccountsListFacade,
    CardsListFacade,
    PurchasePreviewFacade,
    RefundOriginSearchFacade,
    PeopleListFacade,
    DebtsListFacade,
  ],
  host: {
    '(input)': 'markDirty($event)',
    '(change)': 'markDirty($event)',
    '(click)': 'markDirty($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quick-add.page.html',
  styleUrl: './quick-add.page.css',
})
export class QuickAddPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly accountsFacade = inject(AccountsListFacade);
  private readonly cardsFacade = inject(CardsListFacade);
  private readonly categoriesFacade = inject(CategoriesFacade);
  private readonly injector = inject(Injector);
  protected readonly t = inject(I18nService).t;
  protected readonly facade = inject(TransactionFormFacade);
  protected readonly originSearch = inject(RefundOriginSearchFacade);
  protected readonly purchasePreview = inject(PurchasePreviewFacade);

  protected readonly load = signal<LoadState>({ status: 'loading' });
  protected readonly loadProblem = computed(() => {
    const state = this.load();
    return state.status === 'error' ? state.problem : null;
  });
  protected readonly accounts = signal<readonly Account[]>([]);
  protected readonly cards = signal<readonly Card[]>([]);
  private readonly cardsLoad = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  protected readonly cardsProblem = signal<Problem | null>(null);
  protected readonly cardsLoading = computed(
    () => this.mode() === 'credit' && ['idle', 'loading'].includes(this.cardsLoad()),
  );
  protected readonly isPeopleMode = computed(() =>
    (PEOPLE_DATA_MODES as readonly string[]).includes(this.mode()),
  );
  protected readonly peopleLoading = computed(() => {
    const mode = this.mode();
    if (!this.isPeopleMode()) return false;
    const waiting = (state: string) => state === 'idle' || state === 'loading';
    return waiting(this.peopleLoad()) || (mode === 'received' && waiting(this.receivablesLoad()));
  });
  protected readonly peopleFailed = computed(
    () =>
      this.isPeopleMode() &&
      (this.peopleLoad() === 'error' ||
        (this.mode() === 'received' && this.receivablesLoad() === 'error')),
  );
  protected readonly cardsFailed = computed(
    () => this.mode() === 'credit' && this.cardsLoad() === 'error',
  );
  private readonly requestedCard = signal<string | null>(null);
  protected readonly requestedPerson = signal<string | null>(null);
  protected readonly people = signal<readonly PersonRef[]>([]);
  protected readonly receivables = signal<readonly ReceivableOption[]>([]);
  private readonly peopleLoad = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  private readonly receivablesLoad = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  private receivablesSub: Subscription | null = null;
  protected readonly peopleProblem = signal<Problem | null>(null);
  protected readonly prefill = signal<{
    amount: string | null;
    description: string | null;
    date: string | null;
  } | null>(null);
  private readonly lastCard = signal<string | null>(readLastUsedCard());
  protected readonly expenseCategories = signal<readonly Category[]>([]);
  protected readonly incomeCategories = signal<readonly Category[]>([]);
  protected readonly mode = signal<QuickAddMode>(DEFAULT_MODE);
  protected readonly title = computed(() => this.t().quickAdd.modes.titles[this.mode()]);
  protected readonly dirty = signal(false);
  protected readonly lastUsed = signal<string | null>(readLastUsedAccount());
  protected readonly resetToken = signal(0);
  protected readonly focusToken = signal(0);

  protected readonly cashAccounts = computed(() =>
    this.accounts().filter((account) => account.liquidity === 'CASH'),
  );
  protected readonly investmentAccounts = computed(() =>
    this.accounts().filter((account) => account.liquidity === 'INVESTMENT'),
  );
  protected readonly investmentDefault = computed(() => this.defaultFor(this.investmentAccounts()));
  protected readonly cashDefault = computed(() => this.defaultFor(this.cashAccounts()));
  protected readonly anyDefault = computed(() => this.defaultFor(this.accounts()));
  protected readonly cardDefault = computed(() => {
    const cards = this.cards();
    const wanted = this.requestedCard();
    if (wanted && cards.some((card) => card.id === wanted)) return wanted;
    const last = this.lastCard();
    if (last && cards.some((card) => card.id === last)) return last;
    return cards.length === 1 ? (cards[0]?.id ?? null) : null;
  });

  protected readonly blocked = computed<
    'noAccount' | 'needTwoAccounts' | 'noInvestmentAccount' | 'noCard' | null
  >(() => {
    switch (this.mode()) {
      case 'credit':
        return this.cardsLoad() === 'ready' && this.cards().length === 0 ? 'noCard' : null;
      case 'transfer':
        return this.accounts().length < 2 ? 'needTwoAccounts' : null;
      case 'adjustment':
      case 'debt':
        return null;
      case 'investment':
        if (this.cashAccounts().length === 0) return 'noAccount';
        return this.investmentAccounts().length === 0 ? 'noInvestmentAccount' : null;
      default:
        return this.cashAccounts().length === 0 ? 'noAccount' : null;
    }
  });
  protected readonly blockedCopy = computed(() => {
    const kind = this.blocked();
    return kind ? this.t().quickAdd.empty[kind] : null;
  });
  protected readonly emptyActions = computed<readonly EmptyStateAction[]>(() => {
    const copy = this.blockedCopy();
    const noCard = this.blocked() === 'noCard';
    return copy
      ? [
          {
            id: noCard ? 'add-card' : 'add-account',
            label: copy.action,
            available: true,
            primary: true,
            link: noCard ? '/cards/new' : '/accounts/new',
          },
        ]
      : [];
  });

  private readonly asModal = this.route.pathFromRoot.some((r) => r.outlet === 'modal');
  private lastInput: TransactionInput | null = null;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const mode = parseMode(params.get('mode'));
      this.requestedCard.set(params.get('cardId'));
      this.requestedPerson.set(params.get('personId'));
      const amount = params.get('amount')?.trim() ?? '';
      const description = sanitizeSharedText(
        params.get('description') ?? params.get('text') ?? params.get('title'),
      );
      const validAmount = /^\d+(\.\d{1,2})?$/.test(amount) ? amount : null;
      const rawDate = params.get('date')?.trim() ?? '';
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
      this.prefill.set(
        validAmount || description || validDate
          ? { amount: validAmount, description: description || null, date: validDate }
          : null,
      );
      if (mode !== this.mode()) {
        this.mode.set(mode);
        this.dirty.set(false);
        this.facade.dismissProblem();
        this.purchasePreview.request('', null);
      }
    });
    this.facade.saved$.pipe(takeUntilDestroyed()).subscribe((saved) => {
      if (this.lastInput) {
        const accountId = accountOf(this.lastInput);
        if (accountId !== '') {
          writeLastUsedAccount(accountId);
          this.lastUsed.set(accountId);
        }
        const cardId = cardOf(this.lastInput);
        if (cardId !== null) {
          writeLastUsedCard(cardId);
          this.lastCard.set(cardId);
        }
      }
      const savedMode = this.mode();
      this.resetToken.update((value) => value + 1);
      this.purchasePreview.request('', null);
      if (saved.type === 'LOAN_GIVEN' || saved.type === 'MONEY_RECEIVED') this.refreshReceivables();
      const copy = this.t().quickAdd.toast;
      const firstInstallment = saved.type === 'CARD_PURCHASE' ? saved.installments[0] : undefined;
      const viewTarget =
        saved.card && firstInstallment
          ? {
              link: ['/cards', saved.card.id, 'invoices', firstInstallment.invoiceId],
              label: copy.viewInvoice,
            }
          : saved.debt
            ? { link: ['/debts', saved.debt.id], label: copy.viewDebt }
            : saved.shares.length > 0
              ? { link: ['/transactions', saved.id], label: copy.viewDetails }
              : { link: ['/transactions'], label: copy.viewTransactions };
      this.dirty.set(false);
      if (this.asModal) this.close();
      this.toast.show(this.savedMessage(saved, copy), {
        actions: [
          {
            id: 'view',
            label: viewTarget.label,
            run: () => void this.router.navigate(viewTarget.link),
          },
          {
            id: 'new',
            label: copy.newEntry,
            run: () =>
              this.asModal
                ? void this.router.navigate(['/quick-add'], {
                    queryParams: { mode: savedMode === DEFAULT_MODE ? null : savedMode },
                  })
                : this.focusToken.update((value) => value + 1),
          },
        ],
      });
    });
    effect(() => {
      if (!this.isPeopleMode()) return;
      const mode = this.mode();
      untracked(() => {
        if (this.peopleLoad() === 'idle') this.loadPeople();
        if (mode === 'received' && this.receivablesLoad() === 'idle') this.loadReceivables();
      });
    });
    effect(() => {
      const mode = this.mode();
      if ((mode === 'credit' || mode === 'refund') && this.cardsLoad() === 'idle') {
        untracked(() => this.loadCards());
      }
    });
    this.reload();
  }

  private savedMessage(saved: Transaction, copy: AppI18n['quickAdd']['toast']): string {
    const lending = this.t().lending;
    const amount = formatMoney(saved.amount);
    const name = saved.debt ? counterpartyName(saved.debt) : '';
    switch (saved.type) {
      case 'LOAN_GIVEN':
        return interpolate(lending.loan.toast, { amount, name });
      case 'MONEY_RECEIVED':
        return saved.debt?.direction === 'PAYABLE'
          ? interpolate(lending.received.toastBorrowed, { amount, name })
          : interpolate(lending.received.toastRepayment, { amount });
      default:
        return saved.shares.length > 0
          ? lending.shares.toast
          : interpolate(copy.saved, {
              description: transactionLabel(saved, this.t().transactions.types),
              amount,
            });
    }
  }

  protected readonly createPerson = (name: string): Observable<PersonRef> =>
    this.injector
      .get(PeopleListFacade)
      .create({ name, notes: null })
      .pipe(
        tap((person) =>
          this.people.update((list) => [...list, { id: person.id, name: person.name }]),
        ),
      );

  protected ensurePeople(): void {
    if (this.peopleLoad() === 'idle' || this.peopleLoad() === 'error') this.loadPeople();
  }

  protected loadPeople(): void {
    if (this.peopleLoad() === 'loading') return;
    this.peopleLoad.set('loading');
    this.peopleProblem.set(null);
    this.injector
      .get(PeopleListFacade)
      .loadAll('ACTIVE')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (people) => {
          this.people.set(people.map((person) => ({ id: person.id, name: person.name })));
          this.peopleLoad.set('ready');
        },
        error: (error: unknown) => {
          this.peopleProblem.set(problemOf(error));
          this.peopleLoad.set('error');
        },
      });
  }

  protected loadReceivables(silent = false): void {
    this.receivablesSub?.unsubscribe();
    if (!silent) this.receivablesLoad.set('loading');
    this.receivablesSub = this.injector
      .get(DebtsListFacade)
      .loadAllOpen({ direction: 'RECEIVABLE' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (debts) => {
          this.receivables.set(
            debts
              .filter((debt) => isOpenStatus(debt.status))
              .flatMap((debt) => (debt.person ? [{ ...debt, person: debt.person }] : []))
              .map((debt) => ({
                id: debt.id,
                person: debt.person,
                title: debt.description ?? this.t().debts.row.defaultTitleReceivable,
                outstanding: debt.outstanding,
              })),
          );
          this.receivablesLoad.set('ready');
        },
        error: (error: unknown) => {
          if (silent) {
            if (this.mode() !== 'received') this.receivablesLoad.set('idle');
            return;
          }
          this.peopleProblem.set(problemOf(error));
          this.receivablesLoad.set('error');
        },
      });
  }

  private refreshReceivables(): void {
    if (this.receivablesLoad() !== 'idle') this.loadReceivables(true);
  }

  protected onDebtSaved(debt: Debt): void {
    if (debt.direction === 'RECEIVABLE') this.refreshReceivables();
  }

  protected retryPeople(): void {
    if (this.peopleLoad() === 'error') this.loadPeople();
    if (this.receivablesLoad() === 'error') this.loadReceivables();
  }

  protected loadCards(): void {
    this.cardsLoad.set('loading');
    this.cardsProblem.set(null);
    this.cardsFacade
      .loadAll('ACTIVE')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cards) => {
          this.cards.set(cards);
          this.cardsLoad.set('ready');
        },
        error: (error: unknown) => {
          this.cardsProblem.set(problemOf(error));
          this.cardsLoad.set('error');
        },
      });
  }

  protected reload(): void {
    this.load.set({ status: 'loading' });
    loadFormOptions(this.accountsFacade, this.categoriesFacade)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ accounts, expenseCategories, incomeCategories }) => {
          this.accounts.set(accounts);
          this.expenseCategories.set(expenseCategories);
          this.incomeCategories.set(incomeCategories);
          this.load.set({ status: 'ready' });
        },
        error: (error: unknown) => this.load.set({ status: 'error', problem: problemOf(error) }),
      });
  }

  protected close(): void {
    void this.router.navigate(this.asModal ? [{ outlets: { modal: null } }] : ['/']);
  }

  protected markDirty(event: Event): void {
    if (event.type === 'click') {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[role="option"], [role="radio"], [role="switch"], [role="checkbox"]'))
        return;
    }
    this.dirty.set(true);
  }

  protected setMode(mode: QuickAddMode): void {
    if (mode === this.mode()) return;
    void this.router.navigate([], {
      queryParams: { mode: mode === DEFAULT_MODE ? null : mode },
      replaceUrl: true,
    });
  }

  protected submit(input: TransactionInput): void {
    this.lastInput = input;
    this.facade.submit({ kind: 'create', input });
  }

  protected fixedMethod(mode: QuickAddMode): PaymentMethod | null {
    return mode === 'pix' ? 'PIX' : mode === 'debit' ? 'DEBIT' : null;
  }

  private defaultFor(list: readonly Account[]): string | null {
    const last = this.lastUsed();
    if (last && list.some((account) => account.id === last)) return last;
    return list.length === 1 ? (list[0]?.id ?? null) : null;
  }
}

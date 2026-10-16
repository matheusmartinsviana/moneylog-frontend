import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { DisclosureComponent } from '~/app/common/components/disclosure/disclosure.component';
import {
  EmptyStateAction,
  EmptyStateComponent,
} from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { ToastService } from '~/app/common/services/toast.service';
import { ClosingBadgeComponent } from '~/app/features/cards/components/closing-badge/closing-badge.component';
import { ClosingConfirmModalComponent } from '~/app/features/cards/components/closing-confirm-modal/closing-confirm-modal.component';
import { InvoiceDocumentComponent } from '~/app/features/cards/components/invoice-document/invoice-document.component';
import { InvoiceItemsTableComponent } from '~/app/features/cards/components/invoice-items-table/invoice-items-table.component';
import { InvoicePaymentsListComponent } from '~/app/features/cards/components/invoice-payments-list/invoice-payments-list.component';
import { InvoiceTotalsComponent } from '~/app/features/cards/components/invoice-totals/invoice-totals.component';
import { PayInvoiceSheetComponent } from '~/app/features/cards/components/pay-invoice-sheet/pay-invoice-sheet.component';
import { LinkedNotesComponent } from '~/app/features/notes/components/linked-notes/linked-notes.component';
import { AccountsListFacade } from '~/modules/accounts/core/facades/accounts-list.facade';
import type { Account } from '~/modules/accounts/core/types/account';
import { CardDetailFacade } from '~/modules/cards/core/facades/card-detail.facade';
import { InvoiceDetailFacade } from '~/modules/cards/core/facades/invoice-detail.facade';
import type { Invoice } from '~/modules/cards/core/types/invoice';
import { PeopleListFacade } from '~/modules/people/core/facades/people-list.facade';
import { formatCompetenceShort } from '~/util/date';
import type { PersonRef } from '~/util/debt';

@Component({
  selector: 'app-invoice-page',
  imports: [
    DisclosureComponent,
    LinkedNotesComponent,
    RouterLink,
    PageLayoutComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    InvoiceTotalsComponent,
    InvoiceDocumentComponent,
    InvoiceItemsTableComponent,
    InvoicePaymentsListComponent,
    PayInvoiceSheetComponent,
    ClosingBadgeComponent,
    ClosingConfirmModalComponent,
  ],
  providers: [InvoiceDetailFacade, CardDetailFacade, AccountsListFacade, PeopleListFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice.page.html',
  styleUrl: './invoice.page.css',
})
export class InvoicePage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly accountsFacade = inject(AccountsListFacade);
  private readonly toast = inject(ToastService);
  protected readonly t = this.i18n.t;
  protected readonly facade = inject(InvoiceDetailFacade);
  private readonly cardFacade = inject(CardDetailFacade);
  private readonly injector = inject(Injector);

  readonly id = input<string>();
  readonly invoiceId = input.required<string>();

  protected readonly state = this.facade.state;
  protected readonly invoice = this.facade.invoice;
  protected readonly card = this.cardFacade.card;
  protected readonly paying = signal(false);
  protected readonly closingOpen = signal(false);
  protected readonly accounts = signal<readonly Account[]>([]);
  protected readonly people = signal<readonly PersonRef[]>([]);
  protected readonly cashAccounts = computed(() =>
    this.accounts().filter(
      (account) => account.liquidity === 'CASH' && account.status === 'ACTIVE',
    ),
  );

  protected readonly heading = computed(() => {
    const invoice = this.invoice();
    return invoice
      ? interpolate(this.t().cards.invoice.heading, {
          month: formatCompetenceShort(invoice.referenceMonth, HTML_LANG[this.i18n.language()]),
        })
      : this.t().nav.cards;
  });
  protected readonly cardId = computed(() => this.id() ?? this.invoice()?.cardId ?? null);
  protected readonly backLink = computed(() => {
    const cardId = this.cardId();
    return cardId ? ['/cards', cardId] : ['/cards'];
  });
  protected readonly canPay = computed(() => {
    const status = this.invoice()?.status;
    return status !== undefined && status !== 'PAID' && status !== 'FUTURE';
  });
  protected readonly payBlocked = computed(() => {
    const status = this.invoice()?.status;
    return status === 'PAID' || status === 'FUTURE'
      ? this.t().cards.invoice.payBlocked[status]
      : null;
  });
  protected readonly loadProblem = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.problem : null;
  });
  protected readonly notFoundActions = computed<readonly EmptyStateAction[]>(() => [
    {
      id: 'back',
      label: this.t().cards.invoice.notFound.back,
      available: true,
      primary: true,
      link: this.cardId() ? `/cards/${this.cardId()}` : '/cards',
    },
  ]);

  constructor() {
    effect(() => {
      const invoiceId = this.invoiceId();
      untracked(() => this.facade.load(invoiceId));
    });
    effect(() => {
      const id = this.cardId();
      if (id) untracked(() => this.cardFacade.loadCard(id));
    });
    this.accountsFacade
      .loadAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (accounts) => this.accounts.set(accounts), error: () => undefined });
    effect(() => {
      const hasThirdParty = (this.invoice()?.shareByPerson.length ?? 0) > 0;
      untracked(() => {
        if (hasThirdParty && !this.peopleRequested) this.loadPeople();
      });
    });
  }

  private peopleRequested = false;

  private loadPeople(): void {
    this.peopleRequested = true;
    this.injector
      .get(PeopleListFacade)
      .loadAll('ACTIVE')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (people) => this.people.set(people.map(({ id, name }) => ({ id, name }))),
        error: () => undefined,
      });
  }

  protected openPay(): void {
    if (this.canPay()) this.paying.set(true);
  }

  protected closePay(): void {
    this.paying.set(false);
  }

  protected onPaid(invoice: Invoice): void {
    this.paying.set(false);
    this.facade.replace(invoice);
    this.reloadCard();
  }

  protected onDocumentSaved(invoice: Invoice): void {
    this.facade.replace(invoice);
  }

  protected onDocumentConflict(): void {
    this.facade.refresh(this.invoiceId());
  }

  protected afterClosing(): void {
    this.closingOpen.set(false);
    this.toast.show(this.t().cards.closing.toast);
    this.reloadCard();
  }

  private reloadCard(): void {
    const id = this.cardId();
    if (id) this.cardFacade.loadCard(id, true);
  }

  protected retry(): void {
    this.facade.load(this.invoiceId());
  }
}

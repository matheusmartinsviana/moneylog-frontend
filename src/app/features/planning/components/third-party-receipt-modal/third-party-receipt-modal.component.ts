import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';

import { FormModalComponent } from '~/app/common/components/form-modal/form-modal.component';
import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { DatePickerComponent } from '~/app/common/components/forms/date-picker/date-picker.component';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { RadioGroupComponent } from '~/app/common/components/forms/radio-group/radio-group.component';
import { SelectComponent } from '~/app/common/components/forms/select/select.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { dirtySignal } from '~/app/common/forms/dirty-signal';
import { applyProblemToForm } from '~/app/common/forms/problem-form';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { AccountsListFacade } from '~/modules/accounts/core/facades/accounts-list.facade';
import type { Account } from '~/modules/accounts/core/types/account';
import { ThirdPartyReceiptFacade } from '~/modules/third-parties/core/facades/third-party-receipt.facade';
import {
  THIRD_PARTY_CURRENCY,
  type ThirdPartyReceipt,
} from '~/modules/third-parties/core/types/third-party';
import { todayIso } from '~/util/date';

export type ReceiptMode = 'MOVE' | 'IN_BALANCE';

export interface ReceiptPersonOption {
  readonly id: string;
  readonly name: string;
  readonly expenses: readonly { readonly id: string; readonly label: string }[];
}

const CODE_TO_FIELD: Readonly<Record<string, string>> = {
  PERSON_ARCHIVED: 'personId',
  PERSON_NOT_FOUND: 'personId',
  THIRD_PARTY_EXPENSE_INVALID: 'transactionId',
  THIRD_PARTY_EXPENSE_NOT_FOUND: 'transactionId',
  AMOUNT_ABOVE_LIMIT: 'amount',
  TRANSACTION_AMOUNT_NOT_POSITIVE: 'amount',
  DEBT_SETTLEMENT_EXCEEDS_OUTSTANDING: 'amount',
};

export function receiptMessage(
  receipt: ThirdPartyReceipt,
  copy: { byEffect: Readonly<Record<string, string>>; recorded: string },
): string {
  const effect = receipt.ledgerEffect;
  return effect !== null && Object.hasOwn(copy.byEffect, effect)
    ? (copy.byEffect[effect] ?? copy.recorded)
    : copy.recorded;
}

@Component({
  selector: 'app-third-party-receipt-modal',
  imports: [
    ReactiveFormsModule,
    FormModalComponent,
    SelectComponent,
    MoneyInputComponent,
    DatePickerComponent,
    TextFieldComponent,
    RadioGroupComponent,
  ],
  providers: [ThirdPartyReceiptFacade, AccountsListFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-form-modal
      #modal
      [heading]="t().thirdParties.receipts.modal.title"
      [dirty]="dirty()"
      [busy]="facade.saving()"
      (closed)="closed.emit()"
    >
      <form class="form" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate data-cy="tpr-form">
        <p class="hint" data-cy="tpr-description">
          {{ t().thirdParties.receipts.modal.description }}
        </p>
        @if (people().length === 0) {
          <p class="hint" data-cy="tpr-no-people">{{ t().thirdParties.receipts.modal.noPeople }}</p>
        }
        @if (banner(); as message) {
          <p class="banner" role="alert" data-cy="tpr-error">{{ message }}</p>
        }
        <app-select
          formControlName="personId"
          fieldId="tpr-person"
          [options]="personOptions()"
          [label]="t().thirdParties.receipts.modal.person"
        />
        <app-money-input
          formControlName="amount"
          fieldId="tpr-amount"
          [currency]="currency"
          [label]="t().thirdParties.receipts.modal.amount"
        />
        <app-radio-group
          formControlName="mode"
          fieldId="tpr-mode"
          [options]="modeOptions()"
          [label]="t().thirdParties.receipts.modal.mode.label"
          [hint]="t().thirdParties.receipts.modal.mode.hint"
        />
        @switch (form.controls.mode.value) {
          @case ('MOVE') {
            <p class="hint" data-cy="tpr-move-note">
              {{ t().thirdParties.receipts.modal.moveNote }}
            </p>
            @if (accountsFailed()) {
              <div class="inline-error" role="alert" data-cy="tpr-accounts-error">
                <p>{{ t().thirdParties.receipts.modal.accountsError }}</p>
                <button
                  type="button"
                  class="button"
                  data-cy="tpr-accounts-retry"
                  (click)="loadAccounts()"
                >
                  {{ t().thirdParties.receipts.modal.accountsRetry }}
                </button>
              </div>
            } @else if (accountsLoading()) {
              <p class="hint" role="status" data-cy="tpr-accounts-loading">
                {{ t().thirdParties.receipts.modal.accountsLoading }}
              </p>
            } @else if (accounts().length === 0) {
              <p class="hint" data-cy="tpr-no-accounts">
                {{ t().thirdParties.receipts.modal.noAccounts }}
              </p>
            } @else {
              <app-select
                formControlName="accountId"
                fieldId="tpr-account"
                [options]="accountOptions()"
                [label]="t().thirdParties.receipts.modal.account"
              />
            }
          }
          @case ('IN_BALANCE') {
            <p class="warning" role="note" data-cy="tpr-balance-warning">
              {{ t().thirdParties.receipts.modal.balanceWarning }}
            </p>
          }
        }
        <app-date-picker
          formControlName="receivedOn"
          fieldId="tpr-date"
          [label]="t().thirdParties.receipts.modal.date"
        />
        <app-select
          formControlName="transactionId"
          fieldId="tpr-expense"
          [options]="expenseOptions()"
          [mandatory]="false"
          [emptyLabel]="t().thirdParties.receipts.modal.noLink"
          [label]="t().thirdParties.receipts.modal.link"
          [hint]="t().thirdParties.receipts.modal.linkHint"
        />
        <app-text-field
          formControlName="note"
          fieldId="tpr-note"
          autocomplete="off"
          [maxlength]="200"
          [mandatory]="false"
          [label]="t().thirdParties.receipts.modal.note"
        />
        <div class="actions">
          <button type="button" class="button" data-cy="tpr-cancel" (click)="modal.requestClose()">
            {{ t().thirdParties.receipts.modal.cancel }}
          </button>
          <button
            type="submit"
            class="button button--primary"
            data-cy="tpr-save"
            [disabled]="
              facade.saving() || people().length === 0 || form.controls.mode.value === null
            "
            [attr.aria-busy]="facade.saving()"
          >
            {{
              facade.saving()
                ? t().thirdParties.receipts.modal.saving
                : t().thirdParties.receipts.modal.save
            }}
          </button>
        </div>
      </form>
    </app-form-modal>
  `,
  styles: `
    :host {
      display: contents;
    }

    .form {
      display: grid;
      gap: var(--space-4);
    }

    .hint {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .warning {
      margin: 0;
      padding: var(--space-3);
      border: var(--border-width) solid var(--color-warning);
      border-radius: var(--radius-control);
      color: var(--color-text);
      font-size: var(--text-sm);
    }

    .inline-error {
      display: grid;
      gap: var(--space-2);
      color: var(--color-risk);
      font-size: var(--text-sm);
    }

    .inline-error p {
      margin: 0;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-2);
    }
  `,
})
export class ThirdPartyReceiptModalComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly t = inject(I18nService).t;
  protected readonly facade = inject(ThirdPartyReceiptFacade);
  protected readonly currency = THIRD_PARTY_CURRENCY;

  readonly people = input.required<readonly ReceiptPersonOption[]>();
  readonly presetPersonId = input<string | null>(null);
  readonly presetTransactionId = input<string | null>(null);

  readonly closed = output<void>();
  readonly recorded = output<ThirdPartyReceipt>();

  protected readonly form = new FormGroup({
    personId: new FormControl<string | null>(null, [Validators.required]),
    amount: new FormControl<string | null>(null, [Validators.required]),
    receivedOn: new FormControl<string | null>(todayIso()),
    transactionId: new FormControl<string | null>(null),
    mode: new FormControl<ReceiptMode | null>(null, [Validators.required]),
    accountId: new FormControl<string | null>(null),
    note: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
  });
  protected readonly dirty = dirtySignal(this.form);
  private readonly accountsFacade = inject(AccountsListFacade);
  private readonly selectedPerson = signal<string | null>(null);
  protected readonly accounts = signal<readonly Account[]>([]);
  private readonly accountsState = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly accountsLoading = computed(() => this.accountsState() === 'loading');
  protected readonly accountsFailed = computed(() => this.accountsState() === 'error');
  private readonly fieldHandled = signal(false);

  protected readonly personOptions = computed<readonly ChoiceOption[]>(() =>
    this.people().map((person) => ({ value: person.id, label: person.name })),
  );
  protected readonly modeOptions = computed<readonly ChoiceOption[]>(() => {
    const copy = this.t().thirdParties.receipts.modal.mode;
    return [
      { value: 'MOVE', label: copy.MOVE },
      { value: 'IN_BALANCE', label: copy.IN_BALANCE },
    ];
  });
  protected readonly accountOptions = computed<readonly ChoiceOption[]>(() =>
    this.accounts().map((account) => ({ value: account.id, label: account.name })),
  );
  protected readonly expenseOptions = computed<readonly ChoiceOption[]>(() => {
    const person = this.people().find((entry) => entry.id === this.selectedPerson());
    return (person?.expenses ?? []).map((expense) => ({ value: expense.id, label: expense.label }));
  });
  protected readonly banner = computed(() => {
    const problem = this.facade.problem();
    if (!problem || this.fieldHandled()) return null;
    return problemMessage(problem, this.t().errors);
  });

  constructor() {
    this.form.controls.personId.valueChanges.pipe(takeUntilDestroyed()).subscribe((id) => {
      this.selectedPerson.set(id);
      const link = this.form.controls.transactionId.value;
      if (link !== null && !this.expenseOptions().some((option) => option.value === link)) {
        this.form.controls.transactionId.setValue(null);
      }
    });
    effect(() => {
      const problem = this.facade.problem();
      untracked(() =>
        this.fieldHandled.set(
          problem ? applyProblemToForm(this.form, problem, CODE_TO_FIELD) : false,
        ),
      );
    });
    this.form.controls.mode.valueChanges
      .pipe(startWith(this.form.controls.mode.value), takeUntilDestroyed())
      .subscribe((mode) => {
        const account = this.form.controls.accountId;
        account.setValidators(mode === 'MOVE' ? [Validators.required] : []);
        if (mode !== 'MOVE') account.setValue(null, { emitEvent: false });
        account.updateValueAndValidity({ emitEvent: false });
      });
    this.facade.recorded$
      .pipe(takeUntilDestroyed())
      .subscribe((receipt) => this.recorded.emit(receipt));
    this.loadAccounts();
  }

  protected loadAccounts(): void {
    this.accountsState.set('loading');
    this.accountsFacade
      .loadAll('ACTIVE')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (accounts) => {
          this.accounts.set(accounts.filter((account) => account.liquidity === 'CASH'));
          this.accountsState.set('ready');
        },
        error: () => this.accountsState.set('error'),
      });
  }

  ngOnInit(): void {
    this.facade.clearProblem();
    const person = this.presetPersonId();
    if (person !== null) this.form.controls.personId.setValue(person);
    const tx = this.presetTransactionId();
    if (tx !== null) this.form.controls.transactionId.setValue(tx);
    this.form.markAsPristine();
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid || value.personId === null || value.amount === null) return;
    if (value.mode === 'MOVE' && value.accountId === null) return;
    this.facade.record({
      personId: value.personId,
      transactionId: value.transactionId,
      accountId: value.mode === 'MOVE' ? value.accountId : null,
      amount: value.amount,
      receivedOn: value.receivedOn,
      note: value.note,
    });
  }
}

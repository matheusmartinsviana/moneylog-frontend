import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { SelectComponent } from '~/app/common/components/forms/select/select.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { SheetComponent } from '~/app/common/components/sheet/sheet.component';
import { applyProblemToForm } from '~/app/common/forms/problem-form';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import { AccountsListFacade } from '~/modules/accounts/core/facades/accounts-list.facade';
import { OccurrenceRealizeFacade } from '~/modules/recurrences/core/facades/occurrence-realize.facade';
import type {
  RealizedTransaction,
  RecurrenceMethod,
} from '~/modules/recurrences/core/types/recurrence';
import type { CurrencyCode, RealizeForeign } from '~/modules/recurrences/core/types/subscription';
import { formatIsoDate } from '~/util/date';
import type { Money } from '~/util/money';
import { bpsToPercentText, percentTextToBps } from '~/util/ratio';

export interface RealizeTarget {
  readonly recurrenceId: string;
  readonly date: string;
  readonly amount: Money;
  readonly label: string;
  readonly viaCard: boolean | null;
  readonly accountToDefine?: boolean;
  readonly foreign?: RealizeTargetForeign | null;
}

export interface RealizeTargetForeign {
  readonly currency: CurrencyCode;
  readonly originalAmount: string;
  readonly fxRate: string | null;
  readonly iofBps: number | null;
}

const DEFAULT_IOF_BPS = 350;
const FX_RATE = /^\d{1,6}(?:\.\d{1,6})?$/;

export function normalizeFxRate(text: string): string | null {
  const value = text.trim().replace(',', '.');
  return FX_RATE.test(value) && /[1-9]/.test(value) ? value : null;
}

const PAYMENT_METHODS: readonly RecurrenceMethod[] = [
  'PIX',
  'DEBIT',
  'TRANSFER',
  'BOLETO',
  'CASH',
  'OTHER',
];

const STALE_CODES: ReadonlySet<string> = new Set([
  'RECURRENCE_OCCURRENCE_ALREADY_REALIZED',
  'RECURRENCE_OCCURRENCE_SKIPPED',
  'RECURRENCE_NOT_AN_OCCURRENCE',
  'RECURRENCE_INACTIVE',
  'RECURRENCE_ENDED',
]);

const CODE_TO_FIELD: Readonly<Record<string, string>> = {
  RECURRENCE_ACCOUNT_REQUIRED: 'accountId',
  ACCOUNT_NOT_FOUND: 'accountId',
  ACCOUNT_ARCHIVED: 'accountId',
  TRANSACTION_ACCOUNT_NOT_CASH: 'accountId',
  TRANSACTION_PAYMENT_METHOD_REQUIRED: 'method',
  TRANSACTION_AMOUNT_NOT_POSITIVE: 'amount',
  AMOUNT_ABOVE_LIMIT: 'amount',
  FX_RATE_REQUIRED: 'fxRate',
  FX_INVALID: 'fxRate',
};

@Component({
  selector: 'app-realize-sheet',
  imports: [
    ReactiveFormsModule,
    SheetComponent,
    MoneyInputComponent,
    SelectComponent,
    TextFieldComponent,
  ],
  providers: [OccurrenceRealizeFacade, AccountsListFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './realize-sheet.component.html',
  styleUrl: './realize-sheet.component.css',
})
export class RealizeSheetComponent {
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly t = this.i18n.t;
  protected readonly facade = inject(OccurrenceRealizeFacade);
  private readonly accounts = inject(AccountsListFacade);

  readonly open = input.required<boolean>();
  readonly target = input.required<RealizeTarget>();

  readonly closed = output<void>();
  readonly realized = output<RealizedTransaction>();
  readonly stale = output<void>();

  protected readonly form = new FormGroup({
    amount: new FormControl<string | null>(null),
    accountId: new FormControl<string | null>({ value: null, disabled: true }, [
      Validators.required,
    ]),
    method: new FormControl<string | null>({ value: null, disabled: true }, [Validators.required]),
    originalAmount: new FormControl<string | null>({ value: null, disabled: true }),
    fxRate: new FormControl<string | null>({ value: null, disabled: true }, [
      this.textValidator(
        (value) => normalizeFxRate(value) !== null,
        () => this.t().recurrences.realize.foreign.fxInvalid,
      ),
    ]),
    iof: new FormControl<string | null>({ value: null, disabled: true }, [
      this.textValidator(
        (value) => percentTextToBps(value) !== null,
        () => this.t().recurrences.realize.foreign.iofInvalid,
      ),
    ]),
  });
  protected readonly foreign = computed(() => this.target().foreign ?? null);
  protected readonly needsAccount = signal(false);
  protected readonly accountOptions = computed<readonly ChoiceOption[]>(() =>
    (this.accounts.data() ?? [])
      .filter((account) => account.liquidity === 'CASH')
      .map((account) => ({ value: account.id, label: account.name })),
  );
  protected readonly methodOptions = computed<readonly ChoiceOption[]>(() =>
    PAYMENT_METHODS.map((method) => ({
      value: method,
      label: this.t().transactions.methods[method],
    })),
  );
  protected readonly noAccounts = computed(
    () => this.accounts.state().status === 'ready' && this.accountOptions().length === 0,
  );
  protected readonly heading = computed(() =>
    interpolate(this.t().recurrences.realize.title, { label: this.target().label }),
  );
  protected readonly dateText = computed(() =>
    formatIsoDate(this.target().date, HTML_LANG[this.i18n.language()], 'long'),
  );

  private readonly fieldHandled = signal(false);
  protected readonly banner = computed(() => {
    const problem = this.facade.problem();
    if (!problem || this.fieldHandled()) return null;
    return problemMessage(problem, this.t().errors);
  });

  constructor() {
    effect(() => {
      const open = this.open();
      const target = this.target();
      untracked(() => {
        if (!open) return;
        this.facade.reopen(target.recurrenceId, target.date);
        const foreign = target.foreign ?? null;
        this.form.reset({
          amount: target.amount.amount,
          accountId: null,
          method: null,
          originalAmount: foreign?.originalAmount ?? null,
          fxRate: foreign?.fxRate ?? '',
          iof: bpsToPercentText(foreign?.iofBps ?? DEFAULT_IOF_BPS),
        });
        this.requireAccount(target.accountToDefine === true);
        this.requireForeign(foreign !== null);
      });
    });
    effect(() => {
      const problem = this.facade.problem();
      untracked(() => {
        if (problem?.code === 'RECURRENCE_ACCOUNT_REQUIRED') this.requireAccount(true);
        this.fieldHandled.set(
          problem ? applyProblemToForm(this.form, problem, CODE_TO_FIELD) : false,
        );
        if (problem && STALE_CODES.has(problem.code)) this.stale.emit();
      });
    });
    this.facade.realized$.pipe(takeUntilDestroyed()).subscribe((transaction) => {
      const invoice = transaction.invoice;
      const card = transaction.card;
      this.toast.show(
        this.t().recurrences.realize.toast,
        invoice && card
          ? {
              actions: [
                {
                  id: 'invoice',
                  label: this.t().recurrences.realize.viewInvoice,
                  run: () => void this.router.navigate(['/cards', card.id, 'invoices', invoice.id]),
                },
              ],
            }
          : undefined,
      );
      this.realized.emit(transaction);
    });
  }

  private requireAccount(needs: boolean): void {
    this.needsAccount.set(needs);
    const { accountId, method } = this.form.controls;
    if (needs) {
      accountId.enable({ emitEvent: false });
      method.enable({ emitEvent: false });
      this.accounts.load('ACTIVE');
    } else {
      accountId.disable({ emitEvent: false });
      method.disable({ emitEvent: false });
    }
  }

  private requireForeign(needs: boolean): void {
    const { amount, originalAmount, fxRate, iof } = this.form.controls;
    if (needs) {
      amount.disable({ emitEvent: false });
      originalAmount.enable({ emitEvent: false });
      fxRate.enable({ emitEvent: false });
      iof.enable({ emitEvent: false });
    } else {
      amount.enable({ emitEvent: false });
      originalAmount.disable({ emitEvent: false });
      fxRate.disable({ emitEvent: false });
      iof.disable({ emitEvent: false });
    }
  }

  private textValidator(valid: (value: string) => boolean, message: () => string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      return typeof value === 'string' && valid(value) ? null : { message: message() };
    };
  }

  private foreignPayload(target: RealizeTarget): RealizeForeign | null {
    const foreign = target.foreign ?? null;
    if (foreign === null) return null;
    const { originalAmount, fxRate, iof } = this.form.getRawValue();
    const rate = normalizeFxRate(fxRate ?? '');
    const bps = percentTextToBps(iof ?? '');
    if (originalAmount === null || rate === null || bps === null) return null;
    return { originalAmount, currency: foreign.currency, fxRate: rate, iofBps: bps };
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const target = this.target();
    const amount = this.form.controls.amount.value;
    const { accountId, method } = this.form.getRawValue();
    const foreign = this.foreignPayload(target);
    if (target.foreign && foreign === null) return;
    this.facade.realize(
      target.recurrenceId,
      target.date,
      foreign !== null || amount === null || amount === target.amount.amount ? null : amount,
      this.needsAccount() && accountId !== null && method !== null
        ? { accountId, method: method as RecurrenceMethod }
        : null,
      foreign,
    );
  }

  protected close(): void {
    if (!this.facade.saving()) this.closed.emit();
  }
}

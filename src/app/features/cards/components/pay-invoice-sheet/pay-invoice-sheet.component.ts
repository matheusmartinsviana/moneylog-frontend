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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { DatePickerComponent } from '~/app/common/components/forms/date-picker/date-picker.component';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { SelectComponent } from '~/app/common/components/forms/select/select.component';
import { SheetComponent } from '~/app/common/components/sheet/sheet.component';
import { applyProblemToForm } from '~/app/common/forms/problem-form';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import type { Account } from '~/modules/accounts/core/types/account';
import { InvoicePaymentFacade } from '~/modules/cards/core/facades/invoice-payment.facade';
import { CARD_CURRENCY } from '~/modules/cards/core/types/card';
import type { Invoice, InvoiceSummary } from '~/modules/cards/core/types/invoice';
import { formatCompetenceShort, todayIso } from '~/util/date';
import { formatMoney, isPositive } from '~/util/money';

const CODE_TO_FIELD: Readonly<Record<string, string>> = {
  TRANSACTION_ACCOUNT_NOT_CASH: 'accountId',
  ACCOUNT_ARCHIVED: 'accountId',
  ACCOUNT_NOT_FOUND: 'accountId',
  TRANSACTION_AMOUNT_NOT_POSITIVE: 'amount',
  AMOUNT_ABOVE_LIMIT: 'amount',
};

@Component({
  selector: 'app-pay-invoice-sheet',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    SheetComponent,
    SelectComponent,
    MoneyInputComponent,
    DatePickerComponent,
  ],
  providers: [InvoicePaymentFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pay-invoice-sheet.component.html',
  styleUrl: './pay-invoice-sheet.component.css',
})
export class PayInvoiceSheetComponent {
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  protected readonly t = this.i18n.t;
  protected readonly facade = inject(InvoicePaymentFacade);
  protected readonly currency = CARD_CURRENCY;

  readonly open = input.required<boolean>();
  readonly invoice = input<InvoiceSummary | null>(null);
  readonly accounts = input.required<readonly Account[]>();
  readonly defaultAccountId = input<string | null>(null);

  readonly paid = output<Invoice>();
  readonly closed = output<void>();

  protected readonly form = new FormGroup({
    accountId: new FormControl<string | null>(null),
    amount: new FormControl<string | null>(null),
    date: new FormControl<string | null>(todayIso()),
  });

  protected readonly accountOptions = computed<readonly ChoiceOption[]>(() =>
    this.accounts().map((account) => ({ value: account.id, label: account.name })),
  );
  protected readonly heading = computed(() => {
    const invoice = this.invoice();
    return interpolate(this.t().cards.pay.title, {
      month: invoice
        ? formatCompetenceShort(invoice.referenceMonth, HTML_LANG[this.i18n.language()])
        : '',
    });
  });

  private readonly date = signal<string | null>(todayIso());
  protected readonly scheduled = computed(() => {
    const date = this.date();
    return date !== null && date > todayIso();
  });

  private readonly fieldHandled = signal(false);
  protected readonly banner = computed(() => {
    const problem = this.facade.problem();
    if (!problem || this.fieldHandled()) return null;
    return problemMessage(problem, this.t().errors);
  });

  protected readonly previewText = computed(() => {
    const preview = this.facade.previewData();
    if (!preview) return null;
    const copy = this.t().cards.pay.preview;
    switch (preview.kind) {
      case 'FULL':
        return copy.FULL;
      case 'PARTIAL':
        return interpolate(copy.PARTIAL, { amount: formatMoney(preview.outstandingAfter) });
      case 'OVERPAY':
        return interpolate(copy.OVERPAY, { amount: formatMoney(preview.creditCarryAfter) });
      case 'PREPAY':
        return copy.PREPAY;
    }
  });

  constructor() {
    effect(() => {
      const open = this.open();
      const invoice = this.invoice();
      untracked(() => {
        if (!open || !invoice) {
          this.facade.requestPreview(invoice?.id ?? '', null);
          return;
        }
        this.facade.reopen(invoice.id);
        const suggested = isPositive(invoice.outstanding) ? invoice.outstanding.amount : null;
        this.form.reset({ accountId: this.initialAccount(), amount: suggested, date: todayIso() });
        this.date.set(todayIso());
        this.facade.requestPreview(invoice.id, suggested);
      });
    });
    this.form.controls.amount.valueChanges.pipe(takeUntilDestroyed()).subscribe((amount) => {
      const invoice = this.invoice();
      if (invoice && this.open()) this.facade.requestPreview(invoice.id, amount);
    });
    this.form.controls.date.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((date) => this.date.set(date));
    effect(() => {
      const problem = this.facade.problem();
      untracked(() =>
        this.fieldHandled.set(
          problem ? applyProblemToForm(this.form, problem, CODE_TO_FIELD) : false,
        ),
      );
    });
    this.facade.paid$.pipe(takeUntilDestroyed()).subscribe((invoice) => {
      this.toast.show(this.t().cards.pay.toast);
      this.paid.emit(invoice);
    });
  }

  protected onSubmit(): void {
    const invoice = this.invoice();
    this.form.markAllAsTouched();
    if (!invoice || this.form.invalid) return;
    const value = this.form.getRawValue();
    this.facade.pay(invoice.id, {
      accountId: value.accountId ?? '',
      amount: value.amount ?? '',
      date: value.date ?? todayIso(),
    });
  }

  protected close(): void {
    if (!this.facade.saving()) this.closed.emit();
  }

  private initialAccount(): string | null {
    const preferred = this.defaultAccountId();
    const accounts = this.accounts();
    if (preferred && accounts.some((account) => account.id === preferred)) return preferred;
    return accounts.length === 1 ? (accounts[0]?.id ?? null) : null;
  }
}

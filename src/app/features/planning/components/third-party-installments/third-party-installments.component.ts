import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MonthPickerComponent } from '~/app/common/components/forms/month-picker/month-picker.component';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import { ThirdPartyExpectedMonthFacade } from '~/modules/third-parties/core/facades/third-party-expected-month.facade';
import type { ThirdPartyInstallment } from '~/modules/third-parties/core/types/third-party';
import { formatCompetence } from '~/util/date';
import { isPositive } from '~/util/money';

const MIN_MONTH = '2000-01';
const MAX_MONTH = '2100-12';

@Component({
  selector: 'app-third-party-installments',
  imports: [ReactiveFormsModule, MonthPickerComponent, MoneyComponent],
  providers: [ThirdPartyExpectedMonthFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './third-party-installments.component.html',
  styleUrl: './third-party-installments.component.css',
})
export class ThirdPartyInstallmentsComponent {
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  protected readonly t = this.i18n.t;
  protected readonly facade = inject(ThirdPartyExpectedMonthFacade);

  readonly transactionId = input.required<string>();
  readonly personId = input.required<string>();
  readonly installments = input.required<readonly ThirdPartyInstallment[]>();

  readonly changed = output<void>();

  protected readonly minMonth = MIN_MONTH;
  protected readonly maxMonth = MAX_MONTH;
  protected readonly editingId = signal<string | null>(null);
  protected readonly picker = new FormControl<string | null>(null);
  private lastWasReset = false;

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);
  protected readonly errorText = computed(() => {
    const problem = this.facade.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });

  constructor() {
    this.facade.changed$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.editingId.set(null);
      this.toast.show(
        this.lastWasReset
          ? this.t().thirdParties.installments.toast.reset
          : this.t().thirdParties.installments.toast.changed,
      );
      this.changed.emit();
    });
  }

  protected canEdit(installment: ThirdPartyInstallment): boolean {
    return isPositive(installment.pending);
  }

  protected part(installment: ThirdPartyInstallment): string {
    return interpolate(this.t().thirdParties.installments.part, {
      number: String(installment.number),
      total: String(installment.total),
    });
  }

  protected expectedAt(installment: ThirdPartyInstallment): string {
    return interpolate(this.t().thirdParties.installments.expectedAt, {
      month: formatCompetence(installment.expectedMonth, this.locale()),
    });
  }

  protected changeLabel(installment: ThirdPartyInstallment): string {
    return interpolate(this.t().thirdParties.installments.changeLabel, {
      number: String(installment.number),
    });
  }

  protected startEdit(installment: ThirdPartyInstallment): void {
    this.facade.clearProblem();
    this.picker.setValue(installment.expectedMonth);
    this.editingId.set(installment.installmentId);
  }

  protected cancelEdit(): void {
    this.facade.clearProblem();
    this.editingId.set(null);
  }

  protected saveEdit(installment: ThirdPartyInstallment): void {
    const month = this.picker.value;
    if (month === null || this.picker.invalid) return;
    this.lastWasReset = false;
    this.facade.change({
      transactionId: this.transactionId(),
      installmentId: installment.installmentId,
      personId: this.personId(),
      expectedMonth: month,
    });
  }

  protected reset(installment: ThirdPartyInstallment): void {
    this.lastWasReset = true;
    this.facade.change({
      transactionId: this.transactionId(),
      installmentId: installment.installmentId,
      personId: this.personId(),
      expectedMonth: null,
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { MonthSummary, PAYMENT_METHODS } from '~/modules/dashboard/core/types/dashboard-summary';
import { isNegative, isPositive } from '~/util/money';

@Component({
  selector: 'app-month-summary',
  imports: [MoneyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './month-summary.component.html',
  styleUrl: './month-summary.component.css',
})
export class MonthSummaryComponent {
  protected readonly t = inject(I18nService).t;
  protected readonly methods = PAYMENT_METHODS;

  readonly month = input.required<MonthSummary>();

  protected readonly netNegative = computed(() => isNegative(this.month().net));
  protected readonly hasDebtConsumption = computed(() => {
    const value = this.month().debtConsumption;
    return value !== null && isPositive(value);
  });
}

import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { toIncomeExpenseChart } from '~/app/common/components/charts/income-expense-chart.mapper';
import { LineChartComponent } from '~/app/common/components/charts/line-chart.component';
import { GlassPanelComponent } from '~/app/common/components/glass-panel/glass-panel.component';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import {
  SegmentedToggleComponent,
  type SegmentedOption,
} from '~/app/common/components/segmented-toggle/segmented-toggle.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { ValuesVisibilityService } from '~/app/common/services/values-visibility.service';
import type { SpendingOverviewState } from '~/modules/reports/core/facades/spending-overview.facade';
import { REPORT_PERIODS, type ReportPeriod } from '~/modules/reports/core/types/reports';
import { formatMoney, maskedMoney, type Money } from '~/util/money';

@Component({
  selector: 'app-chart-panel',
  imports: [
    GlassPanelComponent,
    LineChartComponent,
    MoneyComponent,
    RouterLink,
    SegmentedToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chart-panel.component.html',
  styleUrl: './chart-panel.component.css',
})
export class ChartPanelComponent {
  private readonly i18n = inject(I18nService);
  private readonly visibility = inject(ValuesVisibilityService);
  protected readonly t = this.i18n.t;

  readonly state = input.required<SpendingOverviewState>();
  readonly period = input<ReportPeriod>('D30');
  readonly periods = input<readonly ReportPeriod[]>(REPORT_PERIODS);
  readonly periodChange = output<ReportPeriod>();
  readonly retry = output<void>();

  protected readonly options = computed<readonly SegmentedOption[]>(() =>
    this.periods().map((value) => ({ value, label: this.t().home.chart.periods[value] })),
  );

  protected readonly forbidden = computed(() => {
    const state = this.state();
    return state.status === 'error' && state.problem.status === 403;
  });

  protected readonly view = computed(() => {
    const state = this.state();
    if (state.status !== 'ready') return null;
    const copy = this.t().home.chart;
    const { keys, series } = toIncomeExpenseChart(state.data, HTML_LANG[this.i18n.language()], {
      income: copy.income,
      expenses: copy.expenses,
    });
    const { totals } = state.data;
    const show = (money: Money): string =>
      this.visibility.hidden() ? maskedMoney(money.currency) : formatMoney(money);
    return {
      keys,
      series,
      totals,
      basis: copy.basis[state.data.basis],
      summary: interpolate(copy.summary, {
        period: copy.periods[state.data.period],
        income: show(totals.income),
        expenses: show(totals.expenses),
      }),
    };
  });

  protected onPeriod(value: string): void {
    if ((REPORT_PERIODS as readonly string[]).includes(value) && value !== this.period()) {
      this.periodChange.emit(value as ReportPeriod);
    }
  }
}

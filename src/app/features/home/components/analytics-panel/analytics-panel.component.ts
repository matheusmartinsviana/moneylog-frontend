import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { EmptyStateComponent } from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { GlassPanelComponent } from '~/app/common/components/glass-panel/glass-panel.component';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import type { MonthlySummaryState } from '~/modules/monthly-summary/core/facades/monthly-summary.facade';
import type { MonthlySummary } from '~/modules/monthly-summary/core/types/monthly-summary';
import { isPositive } from '~/util/money';

const COMPETENCE = /^(\d{4})-(0[1-9]|1[0-2])$/;

@Component({
  selector: 'app-analytics-panel',
  imports: [GlassPanelComponent, MoneyComponent, ErrorStateComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics-panel.component.html',
  styleUrl: './analytics-panel.component.css',
})
export class AnalyticsPanelComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly summary = input.required<MonthlySummaryState>();

  readonly retry = output<void>();

  protected readonly ready = computed<MonthlySummary | null>(() => {
    const state = this.summary();
    return state.status === 'ready' ? state.data : null;
  });
  protected readonly problem = computed(() => {
    const state = this.summary();
    return state.status === 'error' ? state.problem : null;
  });
  protected readonly empty = computed(() => {
    const data = this.ready();
    if (!data) return false;
    return !isPositive(data.income) && !isPositive(data.expenses) && !isPositive(data.investments);
  });
  protected readonly monthLabel = computed(() => {
    const data = this.ready();
    if (!data) return '';
    const match = COMPETENCE.exec(data.competence);
    if (!match) return data.competence;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
    return new Intl.DateTimeFormat(HTML_LANG[this.i18n.language()], {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  });
  protected readonly emptyActions = computed(() => [
    {
      id: 'register',
      label: this.t().home.analytics.empty.action,
      available: true,
      primary: true,
      link: '/quick-add',
    },
  ]);
}

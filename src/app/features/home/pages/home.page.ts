import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  untracked,
} from '@angular/core';

import {
  EmptyStateAction,
  EmptyStateComponent,
} from '~/app/common/components/empty-state/empty-state.component';
import { ViewportService } from '~/app/common/components/overlay/viewport.service';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { MotionStaggerDirective } from '~/app/common/motion/motion-stagger.directive';
import { DebtSummaryCardComponent } from '~/app/features/home/components/debt-summary-card/debt-summary-card.component';
import { FeaturedGoalComponent } from '~/app/features/home/components/featured-goal/featured-goal.component';
import { KpiCardsComponent } from '~/app/features/home/components/kpi-cards/kpi-cards.component';
import { RegisterButtonComponent } from '~/app/features/home/components/register-button/register-button.component';
import { SpendingOverviewComponent } from '~/app/features/home/components/spending-overview/spending-overview.component';
import { UpcomingBriefComponent } from '~/app/features/home/components/upcoming-brief/upcoming-brief.component';
import { DashboardFacade } from '~/modules/dashboard/core/facades/dashboard.facade';
import type { DashboardSummary } from '~/modules/dashboard/core/types/dashboard-summary';
import { GoalsListFacade } from '~/modules/goals/core/facades/goals-list.facade';
import { MonthlySummaryFacade } from '~/modules/monthly-summary/core/facades/monthly-summary.facade';
import { SpendingOverviewFacade } from '~/modules/reports/core/facades/spending-overview.facade';
import type { ReportPeriod } from '~/modules/reports/core/types/reports';
import { LEDGER_GATE, LedgerGate } from '~/util/api/ledger-gate';
import { formatIsoDate } from '~/util/date';

@Component({
  selector: 'app-home-page',
  imports: [
    MotionStaggerDirective,
    DebtSummaryCardComponent,
    FeaturedGoalComponent,
    KpiCardsComponent,
    RegisterButtonComponent,
    SpendingOverviewComponent,
    UpcomingBriefComponent,
    PageLayoutComponent,
    EmptyStateComponent,
  ],
  providers: [
    { provide: LEDGER_GATE, useFactory: () => new LedgerGate() },
    DashboardFacade,
    GoalsListFacade,
    MonthlySummaryFacade,
    SpendingOverviewFacade,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
})
export class HomePage implements OnInit {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly dashboard = inject(DashboardFacade);
  protected readonly goals = inject(GoalsListFacade);
  protected readonly monthly = inject(MonthlySummaryFacade);
  protected readonly overview = inject(SpendingOverviewFacade);
  private readonly viewport = inject(ViewportService);

  protected readonly fit = computed(() => !this.viewport.compact());

  protected readonly emptyActions = computed<readonly EmptyStateAction[]>(() => {
    const copy = this.t().emptyState.home;
    return [
      {
        id: 'add-account',
        label: copy.addAccount,
        available: true,
        primary: true,
        link: '/accounts/new',
      },
      { id: 'import-statement', label: copy.importStatement, available: false },
    ];
  });

  protected readonly retryActions = computed<readonly EmptyStateAction[]>(() => [
    { id: 'retry', label: this.t().home.error.retry, available: true, primary: true },
  ]);

  protected readonly asOf = computed(() => {
    const data = this.dashboard.data();
    if (!data) return undefined;
    const date = formatIsoDate(data.summary.asOf, this.locale(), 'long');
    return interpolate(this.t().home.asOf, { date });
  });

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);

  protected readonly monthlyStatus = computed(() => {
    const status = this.monthly.state().status;
    return status === 'ready'
      ? ('ready' as const)
      : status === 'error'
        ? ('error' as const)
        : ('loading' as const);
  });

  protected readonly goalsStatus = computed(() => {
    const status = this.goals.state().status;
    return status === 'error'
      ? ('error' as const)
      : status === 'loading'
        ? ('loading' as const)
        : ('ready' as const);
  });

  constructor() {
    effect(() => {
      const data = this.dashboard.data();
      if (data === null) return;
      untracked(() => this.loadSecondary(data.summary));
    });
  }

  ngOnInit(): void {
    this.dashboard.load();
    this.goals.load('ACTIVE', true);
  }

  private loadSecondary(summary: DashboardSummary): void {
    this.monthly.load(summary.month.competence);
    this.overview.load(this.overview.period());
  }

  protected changePeriod(period: ReportPeriod): void {
    this.overview.load(period);
  }

  protected onErrorAction(id: string): void {
    if (id === 'retry') this.dashboard.load();
  }
}

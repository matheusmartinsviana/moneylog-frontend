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
import { GlassPanelComponent } from '~/app/common/components/glass-panel/glass-panel.component';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { MotionStaggerDirective } from '~/app/common/motion/motion-stagger.directive';
import { AnalyticsPanelComponent } from '~/app/features/home/components/analytics-panel/analytics-panel.component';
import { ChartPanelComponent } from '~/app/features/home/components/chart-panel/chart-panel.component';
import { PomodoroCardComponent } from '~/app/features/home/components/pomodoro-card/pomodoro-card.component';
import { QuickActionsComponent } from '~/app/features/home/components/quick-actions/quick-actions.component';
import { RecentActivityComponent } from '~/app/features/home/components/recent-activity/recent-activity.component';
import { RegisterButtonComponent } from '~/app/features/home/components/register-button/register-button.component';
import { UpcomingBriefComponent } from '~/app/features/home/components/upcoming-brief/upcoming-brief.component';
import { WalletHeaderComponent } from '~/app/features/home/components/wallet-header/wallet-header.component';
import { DashboardFacade } from '~/modules/dashboard/core/facades/dashboard.facade';
import type { DashboardSummary } from '~/modules/dashboard/core/types/dashboard-summary';
import { MonthlySummaryFacade } from '~/modules/monthly-summary/core/facades/monthly-summary.facade';
import { NotificationSettingsFacade } from '~/modules/notifications/core/facades/notification-settings.facade';
import { ProfileFacade } from '~/modules/notifications/core/facades/profile.facade';
import { SpendingOverviewFacade } from '~/modules/reports/core/facades/spending-overview.facade';
import type { ReportPeriod } from '~/modules/reports/core/types/reports';
import { RecentActivityFacade } from '~/modules/transactions/core/facades/recent-activity.facade';
import { LEDGER_GATE, LedgerGate } from '~/util/api/ledger-gate';
import { formatIsoDate } from '~/util/date';

@Component({
  selector: 'app-home-page',
  imports: [
    MotionStaggerDirective,
    AnalyticsPanelComponent,
    ChartPanelComponent,
    PomodoroCardComponent,
    QuickActionsComponent,
    EmptyStateComponent,
    PageLayoutComponent,
    RecentActivityComponent,
    RegisterButtonComponent,
    UpcomingBriefComponent,
    GlassPanelComponent,
    WalletHeaderComponent,
  ],
  providers: [
    { provide: LEDGER_GATE, useFactory: () => new LedgerGate() },
    DashboardFacade,
    MonthlySummaryFacade,
    NotificationSettingsFacade,
    RecentActivityFacade,
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
  protected readonly monthly = inject(MonthlySummaryFacade);
  protected readonly activity = inject(RecentActivityFacade);
  protected readonly overview = inject(SpendingOverviewFacade);
  protected readonly chartPeriods: readonly ReportPeriod[] = ['D30', 'M3'];
  private readonly settings = inject(NotificationSettingsFacade);
  private readonly profile = inject(ProfileFacade);

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

  protected readonly displayName = computed(() => this.settings.settings()?.displayName ?? null);
  protected readonly photoUrl = this.profile.photoUrl;

  constructor() {
    effect(() => {
      const data = this.dashboard.data();
      if (data === null) return;
      untracked(() => this.loadSecondary(data.summary));
    });
  }

  ngOnInit(): void {
    this.dashboard.load();
    this.settings.load();
    this.overview.load(this.overview.period());
  }

  private loadSecondary(summary: DashboardSummary): void {
    this.monthly.load(summary.month.competence);
    this.activity.load(summary.asOf);
  }

  protected changePeriod(period: ReportPeriod): void {
    this.overview.load(period);
  }

  protected onErrorAction(id: string): void {
    if (id === 'retry') this.dashboard.load();
  }
}

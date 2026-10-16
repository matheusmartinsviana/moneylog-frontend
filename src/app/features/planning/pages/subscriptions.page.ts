import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  EmptyStateAction,
  EmptyStateComponent,
} from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { SectionContainerComponent } from '~/app/common/components/section-container/section-container.component';
import {
  SegmentedOption,
  SegmentedToggleComponent,
} from '~/app/common/components/segmented-toggle/segmented-toggle.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import { EndRecurrenceSheetComponent } from '~/app/features/planning/components/end-recurrence-sheet/end-recurrence-sheet.component';
import { PlanningNavComponent } from '~/app/features/planning/components/planning-nav/planning-nav.component';
import {
  RealizeSheetComponent,
  RealizeTarget,
} from '~/app/features/planning/components/realize-sheet/realize-sheet.component';
import { SubscriptionRowComponent } from '~/app/features/planning/components/subscription-row/subscription-row.component';
import { SubscriptionsFacade } from '~/modules/recurrences/core/facades/subscriptions.facade';
import {
  isForeign,
  RECURRENCE_SCOPES,
  type RecurrenceScope,
  SUBSCRIPTION_STATUS_FILTERS,
  type Subscription,
  type SubscriptionStatusFilter,
} from '~/modules/recurrences/core/types/subscription';

const ALL_SCOPES = 'ALL';

@Component({
  selector: 'app-subscriptions-page',
  imports: [
    PageLayoutComponent,
    SectionContainerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SegmentedToggleComponent,
    MoneyComponent,
    PlanningNavComponent,
    SubscriptionRowComponent,
    EndRecurrenceSheetComponent,
    RealizeSheetComponent,
  ],
  providers: [SubscriptionsFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subscriptions.page.html',
  styleUrl: './subscriptions.page.css',
})
export class SubscriptionsPage implements OnInit {
  private readonly toast = inject(ToastService);
  protected readonly t = inject(I18nService).t;
  protected readonly subscriptions = inject(SubscriptionsFacade);

  protected readonly canceling = signal<Subscription | null>(null);
  protected readonly realizing = signal<RealizeTarget | null>(null);
  protected readonly realizeOpen = signal(false);

  protected readonly statusOptions = computed<readonly SegmentedOption[]>(() =>
    SUBSCRIPTION_STATUS_FILTERS.map((value) => ({
      value,
      label: this.t().subscriptions.filters.status[value],
    })),
  );
  protected readonly scopeOptions = computed<readonly SegmentedOption[]>(() => [
    { value: ALL_SCOPES, label: this.t().subscriptions.filters.scope.ALL },
    ...RECURRENCE_SCOPES.map((value) => ({
      value,
      label: this.t().subscriptions.filters.scope[value],
    })),
  ]);
  protected readonly scopeValue = computed(() => this.subscriptions.filter().scope ?? ALL_SCOPES);
  protected readonly filtered = computed(() => {
    const { status, scope } = this.subscriptions.filter();
    return status !== 'ACTIVE' || scope !== null;
  });
  protected readonly emptyActions = computed<readonly EmptyStateAction[]>(() => [
    {
      id: 'recurrences',
      label: this.t().subscriptions.empty.action,
      available: true,
      primary: true,
      link: '/planning/recurrences',
    },
  ]);
  protected readonly actionError = computed(() => {
    const problem = this.subscriptions.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });
  protected readonly cancelTexts = computed(() => {
    const copy = this.t().subscriptions.cancelSheet;
    const target = this.canceling();
    const name =
      target?.recurrence.description?.trim() ||
      target?.recurrence.category.name ||
      this.t().recurrences.types[target?.recurrence.type ?? 'EXPENSE'];
    return { ...copy, description: interpolate(copy.description, { name }) };
  });

  constructor() {
    this.subscriptions.canceled$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.canceling.set(null);
      this.toast.show(this.t().subscriptions.toast);
    });
  }

  ngOnInit(): void {
    this.subscriptions.load();
  }

  protected setStatus(value: string): void {
    this.subscriptions.setStatus(value as SubscriptionStatusFilter);
  }

  protected setScope(value: string): void {
    this.subscriptions.setScope(value === ALL_SCOPES ? null : (value as RecurrenceScope));
  }

  protected groupLabel(group: string): string {
    return interpolate(this.t().subscriptions.overlaps.group, { group });
  }

  protected retry(): void {
    this.subscriptions.load();
  }

  protected askCancel(subscription: Subscription): void {
    this.subscriptions.clearProblem();
    this.canceling.set(subscription);
  }

  protected confirmCancel(activeUntil: string): void {
    const target = this.canceling();
    if (target) this.subscriptions.cancel(target.recurrence.id, activeUntil);
  }

  protected closeCancel(): void {
    this.canceling.set(null);
  }

  protected askCharge(subscription: Subscription): void {
    const recurrence = subscription.recurrence;
    const date = recurrence.nextOccurrence;
    if (date === null) return;
    this.subscriptions.clearProblem();
    this.realizing.set({
      recurrenceId: recurrence.id,
      date,
      amount: recurrence.amount,
      label: recurrence.description ?? recurrence.category.name,
      viaCard: recurrence.card !== null,
      accountToDefine:
        recurrence.type !== 'CARD_PURCHASE' &&
        recurrence.account === null &&
        recurrence.card === null,
      foreign:
        isForeign(recurrence) && recurrence.originalAmount
          ? {
              currency: recurrence.originalAmount.currency,
              originalAmount: recurrence.originalAmount.amount,
              fxRate: recurrence.referenceFxRate,
              iofBps: recurrence.iofBps,
            }
          : null,
    });
    this.realizeOpen.set(true);
  }

  protected afterRealized(): void {
    this.realizeOpen.set(false);
    this.subscriptions.load();
  }
}

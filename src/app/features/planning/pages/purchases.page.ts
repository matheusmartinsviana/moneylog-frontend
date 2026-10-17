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
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import { PlanningNavComponent } from '~/app/features/planning/components/planning-nav/planning-nav.component';
import {
  PurchaseGroupCardComponent,
  type UnlinkRequest,
} from '~/app/features/planning/components/purchase-group-card/purchase-group-card.component';
import { PurchaseGroupFormModalComponent } from '~/app/features/planning/components/purchase-group-form-modal/purchase-group-form-modal.component';
import { PurchaseLinkModalComponent } from '~/app/features/planning/components/purchase-link-modal/purchase-link-modal.component';
import { PurchaseCommitmentsFacade } from '~/modules/purchase-groups/core/facades/purchase-commitments.facade';
import { PurchaseGroupManageFacade } from '~/modules/purchase-groups/core/facades/purchase-group-manage.facade';
import { PurchaseGroupsListFacade } from '~/modules/purchase-groups/core/facades/purchase-groups-list.facade';
import {
  COMMITMENT_HORIZONS,
  type PurchaseGroup,
  type PurchaseGroupStatus,
} from '~/modules/purchase-groups/core/types/purchase-group';
import { formatCompetence } from '~/util/date';

const STATUSES: readonly PurchaseGroupStatus[] = ['ACTIVE', 'DONE'];

@Component({
  selector: 'app-purchases-page',
  imports: [
    PageLayoutComponent,
    SectionContainerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SegmentedToggleComponent,
    MoneyComponent,
    PlanningNavComponent,
    PurchaseGroupCardComponent,
    PurchaseGroupFormModalComponent,
    PurchaseLinkModalComponent,
  ],
  providers: [PurchaseGroupsListFacade, PurchaseCommitmentsFacade, PurchaseGroupManageFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './purchases.page.html',
  styleUrl: './purchases.page.css',
})
export class PurchasesPage implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  protected readonly t = this.i18n.t;
  protected readonly groups = inject(PurchaseGroupsListFacade);
  protected readonly commitments = inject(PurchaseCommitmentsFacade);
  protected readonly manage = inject(PurchaseGroupManageFacade);

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<PurchaseGroup | null>(null);
  protected readonly linking = signal<PurchaseGroup | null>(null);

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);
  protected readonly statusOptions = computed<readonly SegmentedOption[]>(() =>
    STATUSES.map((value) => ({
      value,
      label:
        value === 'ACTIVE'
          ? this.t().purchaseGroups.filter.active
          : this.t().purchaseGroups.filter.done,
    })),
  );
  protected readonly horizonOptions = computed<readonly SegmentedOption[]>(() =>
    COMMITMENT_HORIZONS.map((count) => ({
      value: String(count),
      label: interpolate(this.t().purchaseGroups.commitment.horizonOption, {
        count: String(count),
      }),
    })),
  );
  protected readonly emptyActions = computed<readonly EmptyStateAction[]>(() =>
    this.groups.filter() === 'ACTIVE'
      ? [{ id: 'add', label: this.t().purchaseGroups.empty.action, available: true, primary: true }]
      : [],
  );
  protected readonly untilText = computed(() => {
    const data = this.commitments.data();
    return data === null
      ? ''
      : interpolate(this.t().purchaseGroups.commitment.until, {
          month: formatCompetence(data.until, this.locale()),
        });
  });
  protected readonly monthRows = computed(() =>
    (this.commitments.data()?.byMonth ?? []).map((month) => ({
      competence: month.competence,
      label: formatCompetence(month.competence, this.locale()),
      amount: month.amount,
      mine: month.mine,
    })),
  );
  protected readonly actionError = computed(() => {
    const problem = this.manage.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });

  constructor() {
    this.manage.changed$.pipe(takeUntilDestroyed()).subscribe(({ change }) => {
      this.toast.show(
        change === 'unlinked'
          ? this.t().purchaseGroups.link.unlinkToast
          : change === 'linked'
            ? this.t().purchaseGroups.link.toast
            : this.t().purchaseGroups.form.toastUpdated,
      );
      this.closeModals();
      this.refresh();
    });
  }

  ngOnInit(): void {
    this.groups.load('ACTIVE');
    this.commitments.load();
  }

  protected setStatus(value: string): void {
    if (value === 'ACTIVE' || value === 'DONE') this.groups.load(value);
  }

  protected setHorizon(value: string): void {
    this.commitments.load(Number(value));
  }

  protected retry(): void {
    this.groups.reload();
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(group: PurchaseGroup): void {
    this.manage.dismissProblem();
    this.editing.set(group);
    this.formOpen.set(true);
  }

  protected openLink(group: PurchaseGroup): void {
    this.manage.dismissProblem();
    this.linking.set(group);
  }

  protected unlink(request: UnlinkRequest): void {
    this.manage.unlink(request.group.id, request.member.transactionId);
  }

  protected afterCreated(): void {
    this.closeModals();
    this.refresh();
  }

  protected closeModals(): void {
    this.formOpen.set(false);
    this.editing.set(null);
    this.linking.set(null);
  }

  private refresh(): void {
    this.groups.reload();
    this.commitments.load();
  }
}

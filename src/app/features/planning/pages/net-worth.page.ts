import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { ConfirmDialogComponent } from '~/app/common/components/confirm-dialog/confirm-dialog.component';
import {
  EmptyStateAction,
  EmptyStateComponent,
} from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { NumberStepperComponent } from '~/app/common/components/forms/number-stepper/number-stepper.component';
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
import { AssetBalanceModalComponent } from '~/app/features/planning/components/asset-balance-modal/asset-balance-modal.component';
import { AssetFormModalComponent } from '~/app/features/planning/components/asset-form-modal/asset-form-modal.component';
import { AssetRowComponent } from '~/app/features/planning/components/asset-row/asset-row.component';
import { PlanningNavComponent } from '~/app/features/planning/components/planning-nav/planning-nav.component';
import { AssetsListFacade } from '~/modules/assets/core/facades/assets-list.facade';
import type { Asset, AssetStatus } from '~/modules/assets/core/types/asset';
import { NetWorthFacade } from '~/modules/net-worth/core/facades/net-worth.facade';
import {
  isValidTargetMonths,
  MAX_TARGET_MONTHS,
  MIN_TARGET_MONTHS,
} from '~/modules/net-worth/core/types/net-worth';

const STATUSES: readonly AssetStatus[] = ['ACTIVE', 'ARCHIVED'];
const DEFAULT_TARGET = 6;

@Component({
  selector: 'app-net-worth-page',
  imports: [
    ReactiveFormsModule,
    PageLayoutComponent,
    SectionContainerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SegmentedToggleComponent,
    NumberStepperComponent,
    ConfirmDialogComponent,
    MoneyComponent,
    PlanningNavComponent,
    AssetRowComponent,
    AssetFormModalComponent,
    AssetBalanceModalComponent,
  ],
  providers: [NetWorthFacade, AssetsListFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './net-worth.page.html',
  styleUrl: './net-worth.page.css',
})
export class NetWorthPage implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  protected readonly t = this.i18n.t;
  protected readonly netWorth = inject(NetWorthFacade);
  protected readonly assets = inject(AssetsListFacade);

  protected readonly minTarget = MIN_TARGET_MONTHS;
  protected readonly maxTarget = MAX_TARGET_MONTHS;
  protected readonly target = new FormControl<number | null>(DEFAULT_TARGET);

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<Asset | null>(null);
  protected readonly balanceTarget = signal<Asset | null>(null);
  protected readonly archiving = signal<Asset | null>(null);
  protected readonly targetInvalid = signal(false);

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);
  protected readonly statusOptions = computed<readonly SegmentedOption[]>(() =>
    STATUSES.map((value) => ({
      value,
      label:
        value === 'ACTIVE'
          ? this.t().netWorth.assets.status.active
          : this.t().netWorth.assets.status.archived,
    })),
  );
  protected readonly emptyActions = computed<readonly EmptyStateAction[]>(() =>
    this.assets.filter() === 'ACTIVE'
      ? [
          {
            id: 'add',
            label: this.t().netWorth.assets.empty.action,
            available: true,
            primary: true,
          },
        ]
      : [],
  );
  protected readonly archiveError = computed(() => {
    const problem = this.assets.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });
  protected readonly coverage = computed(() => {
    const months = this.netWorth.data()?.emergencyReserve.coverageMonths ?? null;
    if (months === null) return null;
    const formatted = new Intl.NumberFormat(this.locale(), {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(months as Intl.StringNumericLiteral);
    return interpolate(this.t().netWorth.reserve.coverageValue, { months: formatted });
  });
  protected readonly targetLabel = computed(() => {
    const months = this.netWorth.data()?.emergencyReserve.targetMonths ?? null;
    return months === null
      ? null
      : interpolate(this.t().netWorth.reserve.targetLabel, { months: String(months) });
  });

  constructor() {
    this.assets.archived$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.toast.show(this.t().netWorth.assets.archiveToast);
      this.archiving.set(null);
      this.refresh();
    });
  }

  ngOnInit(): void {
    this.netWorth.load();
    this.assets.load('ACTIVE');
  }

  protected setStatus(value: string): void {
    if (value === 'ACTIVE' || value === 'ARCHIVED') this.assets.load(value);
  }

  protected retryAssets(): void {
    this.assets.reload();
  }

  protected retryOverview(): void {
    this.netWorth.load();
  }

  protected applyTarget(): void {
    const months = this.target.value;
    if (!isValidTargetMonths(months)) {
      this.targetInvalid.set(true);
      return;
    }
    this.targetInvalid.set(false);
    this.netWorth.setTarget(months);
  }

  protected clearTarget(): void {
    this.targetInvalid.set(false);
    this.target.setValue(DEFAULT_TARGET);
    this.netWorth.setTarget(null);
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(asset: Asset): void {
    this.editing.set(asset);
    this.formOpen.set(true);
  }

  protected openBalance(asset: Asset): void {
    this.balanceTarget.set(asset);
  }

  protected askArchive(asset: Asset): void {
    this.assets.dismissProblem();
    this.archiving.set(asset);
  }

  protected confirmArchive(): void {
    const asset = this.archiving();
    if (asset !== null) this.assets.archive(asset.id);
  }

  protected closeModals(): void {
    this.formOpen.set(false);
    this.editing.set(null);
    this.balanceTarget.set(null);
  }

  protected afterSaved(): void {
    this.closeModals();
    this.refresh();
  }

  private refresh(): void {
    this.assets.reload();
    this.netWorth.load();
  }
}

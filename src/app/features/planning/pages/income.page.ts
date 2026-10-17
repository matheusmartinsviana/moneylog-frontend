import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ConfirmDialogComponent } from '~/app/common/components/confirm-dialog/confirm-dialog.component';
import { DisclosureComponent } from '~/app/common/components/disclosure/disclosure.component';
import {
  EmptyStateAction,
  EmptyStateComponent,
} from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import {
  SegmentedOption,
  SegmentedToggleComponent,
} from '~/app/common/components/segmented-toggle/segmented-toggle.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import { IncomeFormModalComponent } from '~/app/features/planning/components/income-form-modal/income-form-modal.component';
import { IncomePreviewPanelComponent } from '~/app/features/planning/components/income-preview-panel/income-preview-panel.component';
import { IncomeProfileCardComponent } from '~/app/features/planning/components/income-profile-card/income-profile-card.component';
import { PlanningNavComponent } from '~/app/features/planning/components/planning-nav/planning-nav.component';
import { TaxTablesPanelComponent } from '~/app/features/planning/components/tax-tables-panel/tax-tables-panel.component';
import { IncomeProfilesFacade } from '~/modules/income/core/facades/income-profiles.facade';
import type { IncomeProfile, IncomeProfileStatus } from '~/modules/income/core/types/income';

const STATUSES: readonly IncomeProfileStatus[] = ['ACTIVE', 'ARCHIVED'];

@Component({
  selector: 'app-income-page',
  imports: [
    PageLayoutComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    SegmentedToggleComponent,
    ConfirmDialogComponent,
    PlanningNavComponent,
    IncomeProfileCardComponent,
    IncomeFormModalComponent,
    IncomePreviewPanelComponent,
    DisclosureComponent,
    TaxTablesPanelComponent,
  ],
  providers: [IncomeProfilesFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './income.page.html',
  styleUrl: './income.page.css',
})
export class IncomePage implements OnInit {
  private readonly toast = inject(ToastService);
  protected readonly t = inject(I18nService).t;
  protected readonly profiles = inject(IncomeProfilesFacade);

  protected readonly formOpen = signal(false);
  protected readonly editing = signal<IncomeProfile | null>(null);
  protected readonly archiving = signal<IncomeProfile | null>(null);
  private readonly selectedId = signal<string | null>(null);

  protected readonly selected = computed(() => {
    const data = this.profiles.data();
    if (data === null) return null;
    return data.find((profile) => profile.id === this.selectedId()) ?? data[0] ?? null;
  });
  protected readonly statusOptions = computed<readonly SegmentedOption[]>(() =>
    STATUSES.map((value) => ({
      value,
      label: value === 'ACTIVE' ? this.t().income.status.active : this.t().income.status.archived,
    })),
  );
  protected readonly emptyActions = computed<readonly EmptyStateAction[]>(() =>
    this.profiles.filter() === 'ACTIVE'
      ? [{ id: 'add', label: this.t().income.empty.action, available: true, primary: true }]
      : [],
  );
  protected readonly archiveError = computed(() => {
    const problem = this.profiles.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });

  constructor() {
    this.profiles.archived$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.toast.show(this.t().income.profile.archiveToast);
      this.archiving.set(null);
      this.profiles.reload();
    });
  }

  ngOnInit(): void {
    this.profiles.load('ACTIVE');
  }

  protected setStatus(value: string): void {
    if (value === 'ACTIVE' || value === 'ARCHIVED') this.profiles.load(value);
  }

  protected retry(): void {
    this.profiles.reload();
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected openEdit(profile: IncomeProfile): void {
    this.editing.set(profile);
    this.formOpen.set(true);
  }

  protected select(profile: IncomeProfile): void {
    this.selectedId.set(profile.id);
  }

  protected askArchive(profile: IncomeProfile): void {
    this.profiles.dismissProblem();
    this.archiving.set(profile);
  }

  protected confirmArchive(): void {
    const profile = this.archiving();
    if (profile !== null) this.profiles.archive(profile.id);
  }

  protected closeForm(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  protected afterSaved(): void {
    this.closeForm();
    this.profiles.reload();
  }
}

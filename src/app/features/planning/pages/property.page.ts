import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import {
  EmptyStateAction,
  EmptyStateComponent,
} from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { SectionContainerComponent } from '~/app/common/components/section-container/section-container.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { FileDownloadService } from '~/app/common/services/file-download.service';
import { ToastService } from '~/app/common/services/toast.service';
import { PlanningNavComponent } from '~/app/features/planning/components/planning-nav/planning-nav.component';
import {
  ClausesDraft,
  PropertyClausesSheetComponent,
} from '~/app/features/planning/components/property-clauses-sheet/property-clauses-sheet.component';
import {
  PropertySharesSheetComponent,
  SharesDraft,
} from '~/app/features/planning/components/property-shares-sheet/property-shares-sheet.component';
import { PropertyFacade } from '~/modules/commitments/core/facades/property.facade';
import type { CommitmentItem } from '~/modules/commitments/core/types/commitment';
import { PeopleListFacade } from '~/modules/people/core/facades/people-list.facade';
import { formatIsoDate } from '~/util/date';
import { formatBps, formatRatio } from '~/util/ratio';

const MILESTONES_SHOWN = 3;
const MAX_PARTIES = 2;

@Component({
  selector: 'app-property-page',
  imports: [
    RouterLink,
    PageLayoutComponent,
    SectionContainerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    MoneyComponent,
    PlanningNavComponent,
    PropertySharesSheetComponent,
    PropertyClausesSheetComponent,
  ],
  providers: [PropertyFacade, PeopleListFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './property.page.html',
  styleUrl: './property.page.css',
})
export class PropertyPage {
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  private readonly download = inject(FileDownloadService);
  private readonly people = inject(PeopleListFacade);
  protected readonly t = this.i18n.t;
  protected readonly facade = inject(PropertyFacade);

  readonly id = input.required<string>();

  protected readonly commitment = this.facade.commitment;
  protected readonly editingItem = signal<CommitmentItem | null>(null);
  protected readonly editingClauses = signal(false);
  protected readonly showAllSchedule = signal(false);

  protected visibleSchedule(items: readonly CommitmentItem[]): readonly CommitmentItem[] {
    if (this.showAllSchedule() || items.length <= 8) return items;
    const pending = items.filter((item) => !item.paid).slice(0, 6);
    return pending.length > 0 ? pending : items.slice(-3);
  }
  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);

  private readonly names = computed(
    () => new Map((this.people.data() ?? []).map((person) => [person.id, person.name])),
  );
  protected readonly peopleOptions = computed<readonly ChoiceOption[]>(() => {
    const options = (this.people.data() ?? []).map((person) => ({
      value: person.id,
      label: person.name,
    }));
    const current = this.editingItem()?.shares?.find((share) => share.personId !== null);
    const missing =
      current?.personId && !options.some((option) => option.value === current.personId);
    return missing && current.personId
      ? [...options, { value: current.personId, label: this.personName(current.personId) }]
      : options;
  });
  protected readonly backActions = computed<readonly EmptyStateAction[]>(() => [
    {
      id: 'back',
      label: this.t().commitments.detail.back,
      available: true,
      primary: true,
      link: '/planning/commitments',
    },
  ]);
  protected readonly banner = computed(() => {
    const problem = this.facade.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });
  protected readonly exportBanner = computed(() => {
    const problem = this.facade.exportProblem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });
  protected readonly progressText = computed(() => {
    const value = this.commitment()?.progress ?? null;
    return value === null ? null : formatRatio(value, this.locale());
  });
  protected readonly milestones = computed(() =>
    (this.commitment()?.schedule ?? [])
      .filter((item) => !item.paid && item.dueDate !== null)
      .slice()
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
      .slice(0, MILESTONES_SHOWN),
  );
  protected readonly undefinedCount = computed(
    () => (this.commitment()?.schedule ?? []).filter((item) => item.sharesDefined !== true).length,
  );
  protected readonly undefinedBanner = computed(() =>
    interpolate(this.t().property.schedule.undefinedBanner, {
      count: String(this.undefinedCount()),
    }),
  );
  protected readonly lateFee = computed(() => this.bps(this.commitment()?.clauses?.lateFeeBps));
  protected readonly monthlyInterest = computed(() =>
    this.bps(this.commitment()?.clauses?.monthlyInterestBps),
  );
  protected readonly retention = computed(() =>
    this.bps(this.commitment()?.clauses?.terminationRetentionBps),
  );

  constructor() {
    this.people.load('ACTIVE');
    effect(() => {
      const id = this.id();
      untracked(() => this.facade.load(id));
    });
    this.facade.changed$.pipe(takeUntilDestroyed()).subscribe((change) => {
      this.editingItem.set(null);
      this.editingClauses.set(false);
      this.toast.show(
        change === 'shares'
          ? this.t().property.editShares.toast
          : this.t().property.editClauses.toast,
      );
    });
    this.facade.file$.pipe(takeUntilDestroyed()).subscribe((file) => {
      const prepared = this.download.prepare(file);
      this.download.save(prepared);
      setTimeout(() => prepared.release());
      this.toast.show(interpolate(this.t().property.export.saved, { name: file.filename }));
    });
  }

  protected retry(): void {
    this.facade.load(this.id());
  }

  protected exportCsv(): void {
    this.facade.exportCsv(this.i18n.language());
  }

  protected askShares(item: CommitmentItem): void {
    this.facade.clearProblem();
    this.editingItem.set(item);
  }

  protected closeShares(): void {
    if (!this.facade.busy()) this.editingItem.set(null);
  }

  protected saveShares(draft: SharesDraft): void {
    const item = this.editingItem();
    if (!item) return;
    const shares = [
      { personId: null, amount: draft.mine },
      ...(draft.coBuyerPersonId !== null && draft.coBuyerAmount !== null
        ? [{ personId: draft.coBuyerPersonId, amount: draft.coBuyerAmount }]
        : []),
    ];
    this.facade.updateShares(item.position, { shares, coBuyerPersonId: draft.coBuyerPersonId });
  }

  protected askClauses(): void {
    this.facade.clearProblem();
    this.editingClauses.set(true);
  }

  protected closeClauses(): void {
    if (!this.facade.busy()) this.editingClauses.set(false);
  }

  protected saveClauses(draft: ClausesDraft): void {
    this.facade.updateClauses(draft);
  }

  protected canEditShares(item: CommitmentItem): boolean {
    return (item.shares?.length ?? 0) <= MAX_PARTIES;
  }

  protected personName(personId: string | null): string {
    if (personId === null) return this.t().property.schedule.me;
    return this.names().get(personId) ?? this.t().property.schedule.otherPerson;
  }

  protected shareLabel(personId: string | null): string {
    if (personId === null) return this.t().property.schedule.mine;
    const name = this.names().get(personId);
    return name
      ? interpolate(this.t().property.schedule.coBuyer, { name })
      : this.t().property.schedule.otherPerson;
  }

  protected date(value: string): string {
    return formatIsoDate(value, this.locale(), 'long');
  }

  protected due(item: CommitmentItem): string {
    return item.dueDate === null
      ? this.t().property.schedule.noDate
      : interpolate(this.t().property.schedule.due, { date: this.date(item.dueDate) });
  }

  protected paidOn(item: CommitmentItem): string {
    return item.paidOn === null
      ? this.t().property.schedule.pending
      : interpolate(this.t().property.schedule.paidOn, { date: this.date(item.paidOn) });
  }

  protected milestoneDue(item: CommitmentItem): string {
    return item.dueDate === null
      ? this.t().property.milestones.noDate
      : interpolate(this.t().property.milestones.due, { date: this.date(item.dueDate) });
  }

  protected editLabel(item: CommitmentItem): string {
    return interpolate(this.t().property.schedule.editLabel, { label: item.label });
  }

  private bps(value: number | undefined): string | null {
    return value === undefined ? null : formatBps(value, this.locale());
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ConfirmDialogComponent } from '~/app/common/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import { OccurrenceRowComponent } from '~/app/features/planning/components/occurrence-row/occurrence-row.component';
import { PlanningNavComponent } from '~/app/features/planning/components/planning-nav/planning-nav.component';
import {
  RealizeSheetComponent,
  RealizeTarget,
} from '~/app/features/planning/components/realize-sheet/realize-sheet.component';
import { OccurrencesFacade } from '~/modules/recurrences/core/facades/occurrences.facade';
import type { Occurrence } from '~/modules/recurrences/core/types/recurrence';

@Component({
  selector: 'app-occurrences-page',
  imports: [
    PageLayoutComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    PlanningNavComponent,
    OccurrenceRowComponent,
    RealizeSheetComponent,
  ],
  providers: [OccurrencesFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './occurrences.page.html',
  styleUrl: './occurrences.page.css',
})
export class OccurrencesPage implements OnInit {
  private readonly toast = inject(ToastService);
  protected readonly t = inject(I18nService).t;
  protected readonly occurrences = inject(OccurrencesFacade);

  protected readonly realizing = signal<RealizeTarget | null>(null);
  protected readonly realizeOpen = signal(false);
  protected readonly skipping = signal<Occurrence | null>(null);

  protected readonly overdue = computed(
    () => this.occurrences.data()?.filter((occurrence) => occurrence.overdue) ?? [],
  );
  protected readonly upcoming = computed(
    () => this.occurrences.data()?.filter((occurrence) => !occurrence.overdue) ?? [],
  );
  protected readonly skipError = computed(() => {
    const problem = this.occurrences.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });

  constructor() {
    this.occurrences.skipped$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.skipping.set(null);
      this.toast.show(this.t().recurrences.occurrences.toastSkipped);
    });
    effect(() => {
      if (this.occurrences.problem()) untracked(() => this.skipping.set(null));
    });
  }

  ngOnInit(): void {
    this.occurrences.load();
  }

  protected askRealize(occurrence: Occurrence): void {
    this.occurrences.clearProblem();
    this.realizeOpen.set(true);
    this.realizing.set({
      recurrenceId: occurrence.recurrenceId,
      date: occurrence.date,
      amount: occurrence.amount,
      label: occurrence.description ?? this.t().recurrences.types[occurrence.type],
      viaCard: occurrence.cardId !== null,
      accountToDefine:
        occurrence.type !== 'CARD_PURCHASE' &&
        occurrence.accountId === null &&
        occurrence.cardId === null,
    });
  }

  protected afterRealized(): void {
    this.realizeOpen.set(false);
    this.occurrences.reload();
  }

  protected askSkip(occurrence: Occurrence): void {
    this.occurrences.clearProblem();
    this.skipping.set(occurrence);
  }

  protected confirmSkip(): void {
    const occurrence = this.skipping();
    if (occurrence) this.occurrences.skip(occurrence.recurrenceId, occurrence.date);
  }

  protected cancelSkip(): void {
    if (!this.occurrences.skipping()) this.skipping.set(null);
  }

  protected retry(): void {
    this.occurrences.load();
  }
}

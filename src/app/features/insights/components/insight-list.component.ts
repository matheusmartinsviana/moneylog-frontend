import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { insightLines } from '~/app/features/ai/insight-text';
import type { InsightsState } from '~/modules/ai/core/facades/insights.facade';

@Component({
  selector: 'app-insight-list',
  imports: [RouterLink, EmptyStateComponent, ErrorStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state().status) {
      @case ('loading') {
        <p class="state-note" role="status" data-cy="insights-loading">
          {{ t().ai.insights.loading }}
        </p>
      }
      @case ('error') {
        <app-error-state [problem]="problem()" (retry)="retry.emit()" />
      }
      @case ('ready') {
        @if (lines().length > 0) {
          <ul class="il" data-cy="insights-list">
            @for (line of lines(); track line.id) {
              <li class="il__item">
                <p>{{ line.text }}</p>
                @if (line.categoryId) {
                  <p class="il__muted">
                    <a
                      class="il__link hit"
                      routerLink="/transactions"
                      [queryParams]="{ categoryId: line.categoryId }"
                      data-cy="insight-spending-link"
                      >{{ t().ai.insights.viewSpending }}</a
                    >
                  </p>
                }
              </li>
            }
          </ul>
        } @else {
          <p class="state-note" data-cy="insights-empty">{{ t().ai.insights.empty }}</p>
        }
      }
      @default {
        <app-empty-state
          [heading]="t().ai.insights.empty"
          [description]="t().ai.insights.emptyHint"
          illustration="grid"
        />
      }
    }
  `,
  styles: `
    .il {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
      gap: var(--space-5) var(--space-8);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .il__item {
      display: grid;
      align-content: start;
      gap: var(--space-2);
      padding-top: var(--space-4);
      border-top: var(--border-width) solid var(--home-divider);
      text-wrap: pretty;
    }

    .il__muted {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .il__link {
      position: relative;
      display: inline-flex;
      align-items: center;
      min-height: var(--touch-min);
      color: var(--color-accent);
      font-weight: var(--weight-medium);
    }
  `,
})
export class InsightListComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly state = input.required<InsightsState>();
  readonly retry = output<void>();

  protected readonly problem = computed(() => {
    const s = this.state();
    return s.status === 'error' ? s.problem : null;
  });
  protected readonly lines = computed(() => {
    const s = this.state();
    return s.status === 'ready'
      ? insightLines(s.items, this.t().ai.insights, HTML_LANG[this.i18n.language()])
      : [];
  });
}

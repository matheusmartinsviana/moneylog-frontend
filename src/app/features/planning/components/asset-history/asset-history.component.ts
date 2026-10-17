import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';

import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { AssetHistoryFacade } from '~/modules/assets/core/facades/asset-history.facade';
import type { AssetBalancePoint } from '~/modules/assets/core/types/asset';
import { formatInstant, formatIsoDate } from '~/util/date';
import { formatMoney } from '~/util/money';

@Component({
  selector: 'app-asset-history',
  imports: [ErrorStateComponent],
  providers: [AssetHistoryFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="history"
      [attr.aria-label]="t().netWorth.assets.history.title"
      data-cy="asset-history"
    >
      <h4 class="history__title">{{ t().netWorth.assets.history.title }}</h4>
      @switch (history.state().status) {
        @case ('loading') {
          <p class="note" role="status" data-cy="asset-history-loading">
            {{ t().netWorth.assets.history.loading }}
          </p>
        }
        @case ('error') {
          <app-error-state [problem]="history.error()" (retry)="load()" />
        }
        @case ('ready') {
          @if (points().length === 0) {
            <p class="note" data-cy="asset-history-empty">
              {{ t().netWorth.assets.history.empty }}
            </p>
          } @else {
            <ul class="list" data-cy="asset-history-list">
              @for (point of points(); track point.recordedAt) {
                <li class="point">
                  <span class="point__line num">{{ lineText(point) }}</span>
                  <span class="note">{{ recordedText(point) }}</span>
                </li>
              }
            </ul>
          }
        }
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .history {
      display: grid;
      gap: var(--space-2);
    }

    .history__title {
      margin: 0;
      font-size: var(--text-sm);
      font-weight: var(--weight-semibold);
    }

    .note {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .list {
      display: grid;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .point {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-1) var(--space-4);
    }

    .point__line {
      font-weight: var(--weight-medium);
    }
  `,
})
export class AssetHistoryComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly history = inject(AssetHistoryFacade);

  readonly assetId = input.required<string>();
  readonly refreshKey = input<string>('');

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);
  protected readonly points = computed<readonly AssetBalancePoint[]>(() => {
    const state = this.history.state();
    return state.status === 'ready' ? state.data : [];
  });

  constructor() {
    effect(() => {
      const id = this.assetId();
      this.refreshKey();
      untracked(() => this.history.load(id));
    });
  }

  protected load(): void {
    this.history.load(this.assetId());
  }

  protected lineText(point: AssetBalancePoint): string {
    return interpolate(this.t().netWorth.assets.history.line, {
      amount: formatMoney(point.balance),
      date: formatIsoDate(point.date, this.locale(), 'long'),
    });
  }

  protected recordedText(point: AssetBalancePoint): string {
    return interpolate(this.t().netWorth.assets.history.recordedAt, {
      date: formatInstant(point.recordedAt, this.locale()),
    });
  }
}

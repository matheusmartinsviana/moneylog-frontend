import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { ClosingBadgeComponent } from '~/app/features/cards/components/closing-badge/closing-badge.component';
import { LimitMeterComponent } from '~/app/features/cards/components/limit-meter/limit-meter.component';
import type { Card } from '~/modules/cards/core/types/card';
import { formatMoney, isPositive } from '~/util/money';

@Component({
  selector: 'app-card-header',
  imports: [MoneyComponent, LimitMeterComponent, ClosingBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = card();
    <section class="header glass-panel glass-panel--strong glass-panel--card" data-cy="card-header">
      <div class="header__focus">
        <p class="caption">{{ t().cards.detail.totalCommittedLabel }}</p>
        <p class="figure header__total" data-cy="card-total-committed">
          <app-money [value]="c.totalCommitted" />
        </p>
      </div>
      <app-limit-meter [card]="c" />
      <dl class="header__facts">
        <div class="header__fact">
          <dt class="caption">{{ t().cards.detail.limitLabel }}</dt>
          <dd class="header__value" data-cy="card-limit-value">
            @if (c.limit; as limit) {
              <app-money [value]="limit" />
            } @else {
              {{ t().cards.limit.notSet }}
            }
          </dd>
        </div>
        @if (c.availableLimit; as available) {
          <div class="header__fact">
            <dt class="caption">{{ t().cards.detail.availableLabel }}</dt>
            <dd class="header__value" [class.is-negative]="c.overLimit" data-cy="card-available">
              <app-money [value]="available" />
            </dd>
          </div>
        }
        @if (hasCredit()) {
          <div class="header__fact">
            <dt class="caption">{{ t().cards.detail.creditBalanceLabel }}</dt>
            <dd class="header__value" data-cy="card-credit-balance">
              <app-money [value]="c.creditBalance" />
            </dd>
          </div>
        }
      </dl>
      <p class="caption" data-cy="card-days">{{ days() }}</p>
      <p class="caption header__future" data-cy="card-committed-future">{{ committedFuture() }}</p>
      @if (!c.closingConfirmed) {
        <div class="header__closing">
          <app-closing-badge [cardId]="c.id" />
          <p class="caption" data-cy="card-closing-hint">{{ t().cards.closing.hint }}</p>
          <button
            type="button"
            class="button"
            data-cy="card-closing-confirm"
            (click)="confirmClosing.emit()"
          >
            {{ t().cards.closing.action }}
          </button>
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .header {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-5);
    }

    .header__focus {
      display: grid;
      gap: var(--space-1);
    }

    .header__total {
      margin: 0;
    }

    .header__facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
      gap: var(--space-3);
      margin: 0;
    }

    .header__fact {
      display: grid;
      gap: 2px;
      min-width: 0;
    }

    .header__value {
      margin: 0;
      font-size: var(--text-md);
      font-weight: var(--weight-medium);
      font-variant-numeric: tabular-nums;
    }

    .header__value.is-negative {
      color: var(--color-risk);
    }

    .header__closing {
      display: grid;
      justify-items: start;
      gap: var(--space-2);
    }
  `,
})
export class CardHeaderComponent {
  protected readonly t = inject(I18nService).t;

  readonly card = input.required<Card>();
  readonly confirmClosing = output<void>();

  protected readonly hasCredit = computed(() => isPositive(this.card().creditBalance));
  protected readonly committedFuture = computed(() =>
    interpolate(this.t().cards.detail.committedFuture, {
      amount: formatMoney(this.card().committedFuture),
    }),
  );
  protected readonly days = computed(() =>
    interpolate(this.t().cards.detail.days, {
      closing: String(this.card().closingDay),
      due: String(this.card().dueDay),
    }),
  );
}

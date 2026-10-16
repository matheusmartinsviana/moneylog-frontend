import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { AssetHistoryComponent } from '~/app/features/planning/components/asset-history/asset-history.component';
import type { Asset } from '~/modules/assets/core/types/asset';
import { formatIsoDate } from '~/util/date';
import { formatMoney } from '~/util/money';

@Component({
  selector: 'li[app-asset-row]',
  imports: [MoneyComponent, AssetHistoryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'row', '[attr.data-cy]': "'asset-' + asset().id" },
  template: `
    @let a = asset();
    <div class="head">
      <div class="head__title">
        <h3 class="name" [attr.data-cy]="'asset-name-' + a.id">{{ a.name }}</h3>
        <span class="tag" [attr.data-cy]="'asset-kind-' + a.id">{{
          t().netWorth.assets.kind[a.kind]
        }}</span>
        <span
          class="tag"
          [class.tag--locked]="a.availability === 'RESERVED'"
          [attr.data-cy]="'asset-availability-' + a.id"
          >{{ t().netWorth.assets.availability[a.availability] }}</span
        >
        @if (a.countsAsReserve) {
          <span class="tag" [attr.data-cy]="'asset-reserve-' + a.id">{{
            t().netWorth.assets.countsAsReserve
          }}</span>
        }
        @if (a.status === 'ARCHIVED') {
          <span class="tag">{{ t().netWorth.assets.archived }}</span>
        }
      </div>
      <p class="balance" [attr.data-cy]="'asset-balance-' + a.id">
        <app-money [value]="a.balance" />
      </p>
    </div>
    <p class="note" [attr.data-cy]="'asset-balance-date-' + a.id">{{ balanceDate() }}</p>
    @if (employer(); as text) {
      <p class="note">{{ text }}</p>
    }
    @if (deposit(); as text) {
      <p class="note" [attr.data-cy]="'asset-deposit-' + a.id">{{ text }}</p>
    }

    <div class="actions quiet-actions">
      <button
        type="button"
        class="button"
        [attr.data-cy]="'asset-history-toggle-' + a.id"
        [attr.aria-expanded]="historyOpen()"
        [attr.aria-label]="
          label(historyOpen() ? t().netWorth.assets.hideHistory : t().netWorth.assets.showHistory)
        "
        (click)="historyOpen.set(!historyOpen())"
      >
        {{ historyOpen() ? t().netWorth.assets.hideHistory : t().netWorth.assets.showHistory }}
      </button>
      @if (a.status === 'ACTIVE') {
        <button
          type="button"
          class="button"
          [attr.data-cy]="'asset-update-balance-' + a.id"
          [attr.aria-label]="label(t().netWorth.assets.updateBalance)"
          [disabled]="busy()"
          (click)="balanceRequested.emit(a)"
        >
          {{ t().netWorth.assets.updateBalance }}
        </button>
        <button
          type="button"
          class="button"
          [attr.data-cy]="'asset-edit-' + a.id"
          [attr.aria-label]="label(t().netWorth.assets.edit)"
          [disabled]="busy()"
          (click)="editRequested.emit(a)"
        >
          {{ t().netWorth.assets.edit }}
        </button>
        <button
          type="button"
          class="button"
          [attr.data-cy]="'asset-archive-' + a.id"
          [attr.aria-label]="label(t().netWorth.assets.archive)"
          [disabled]="busy()"
          (click)="archiveRequested.emit(a)"
        >
          {{ t().netWorth.assets.archive }}
        </button>
      }
    </div>

    @if (historyOpen()) {
      <app-asset-history [assetId]="a.id" [refreshKey]="a.version + ':' + a.balanceDate" />
    }
  `,
  styles: `
    :host(.row) {
      display: grid;
      gap: var(--space-3);
      padding: var(--space-4);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-card);
      background-color: var(--card-flat-bg);
      list-style: none;
    }

    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--space-1) var(--space-4);
    }

    .head__title {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
      min-width: 0;
    }

    .name {
      margin: 0;
      font-size: var(--text-base);
      font-weight: var(--weight-semibold);
      overflow-wrap: anywhere;
    }

    .balance {
      margin: 0;
      font-weight: var(--weight-semibold);
    }

    .note {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .tag {
      padding: 0 var(--space-2);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-pill);
      color: var(--color-text-muted);
      font-size: var(--text-xs);
    }

    .tag--locked {
      border-color: var(--color-warning);
      color: var(--color-warning);
    }

    .actions .button {
      padding-inline: 0;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
  `,
})
export class AssetRowComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly asset = input.required<Asset>();
  readonly busy = input(false);
  readonly editRequested = output<Asset>();
  readonly balanceRequested = output<Asset>();
  readonly archiveRequested = output<Asset>();

  protected readonly historyOpen = signal(false);
  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);

  protected readonly balanceDate = computed(() =>
    interpolate(this.t().netWorth.assets.balanceOn, {
      date: formatIsoDate(this.asset().balanceDate, this.locale(), 'long'),
    }),
  );
  protected readonly employer = computed(() => {
    const name = this.asset().employer?.trim();
    return name ? interpolate(this.t().netWorth.assets.employer, { name }) : null;
  });
  protected readonly deposit = computed(() => {
    const amount = this.asset().monthlyDeposit;
    return amount === null
      ? null
      : interpolate(this.t().netWorth.assets.monthlyDeposit, { amount: formatMoney(amount) });
  });

  protected label(action: string): string {
    return interpolate(this.t().netWorth.assets.actionAria, {
      action,
      name: this.asset().name,
    });
  }
}

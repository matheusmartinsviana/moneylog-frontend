import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import type { EntryTotals } from '~/modules/transactions/core/types/entry';
import type { TransactionTotals } from '~/modules/transactions/core/types/transaction';
import { isNegative } from '~/util/money';

@Component({
  selector: 'app-totals-row',
  imports: [MoneyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './totals-row.component.html',
  styleUrl: './totals-row.component.css',
})
export class TotalsRowComponent {
  protected readonly t = inject(I18nService).t;

  readonly variant = input<'footer' | 'summary'>('footer');
  readonly recordTotals = input<TransactionTotals | null>(null);
  readonly entryTotals = input<EntryTotals | null>(null);
  readonly accountScoped = input(false);
  readonly voidedOnly = input(false);

  protected readonly netLabel = computed(() =>
    this.accountScoped()
      ? this.t().transactions.totals.netAccount
      : this.t().transactions.totals.net,
  );
  protected readonly cy = computed(() => `totals-${this.variant()}`);

  protected negative = isNegative;
}

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { TooltipDirective } from '~/app/common/components/tooltip/tooltip.directive';
import { I18nService } from '~/app/common/i18n/i18n.service';
import type { DashboardBalances } from '~/modules/dashboard/core/types/dashboard-summary';
import { isNegative, isPositive } from '~/util/money';

let nextId = 0;

@Component({
  selector: 'app-available-balance',
  imports: [MoneyComponent, RouterLink, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './available-balance.component.html',
  styleUrl: './available-balance.component.css',
})
export class AvailableBalanceComponent {
  protected readonly t = inject(I18nService).t;

  readonly balances = input.required<DashboardBalances>();

  protected readonly headingId = `available-title-${++nextId}`;
  protected readonly negative = computed(() => isNegative(this.balances().available));
  protected readonly hasReserved = computed(() => isPositive(this.balances().reserved));
}

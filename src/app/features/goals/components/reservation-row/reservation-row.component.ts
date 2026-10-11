import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import type { GoalReservation } from '~/modules/goals/core/types/goal';
import { formatIsoDate } from '~/util/date';
import { isNegative, withoutSign } from '~/util/money';

@Component({
  selector: 'li[app-reservation-row]',
  imports: [MoneyComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reservation-row.component.html',
  styleUrl: './reservation-row.component.css',
  host: { class: 'row', '[attr.data-cy]': "'reservation-row-' + reservation().id" },
})
export class ReservationRowComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly reservation = input.required<GoalReservation>();

  protected readonly release = computed(() => isNegative(this.reservation().amount));
  protected readonly amount = computed(() => withoutSign(this.reservation().amount));
  protected readonly date = computed(() =>
    formatIsoDate(this.reservation().date, HTML_LANG[this.i18n.language()], 'long'),
  );
  protected readonly account = computed(() =>
    interpolate(this.t().goals.detail.onAccount, { account: this.reservation().account.name }),
  );
}

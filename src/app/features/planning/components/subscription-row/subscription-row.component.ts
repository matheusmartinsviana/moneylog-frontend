import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { frequencyText } from '~/app/features/planning/recurrence-text';
import { isForeign, type Subscription } from '~/modules/recurrences/core/types/subscription';
import { formatIsoDate } from '~/util/date';
import { formatBps } from '~/util/ratio';

@Component({
  selector: 'li[app-subscription-row]',
  imports: [MoneyComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './subscription-row.component.html',
  styleUrl: './subscription-row.component.css',
  host: { class: 'row', '[attr.data-cy]': "'subscription-row-' + subscription().recurrence.id" },
})
export class SubscriptionRowComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly subscription = input.required<Subscription>();
  readonly overlapping = input(false);
  readonly busy = input(false);
  readonly chargeRequested = output<Subscription>();
  readonly cancelRequested = output<Subscription>();

  private readonly locale = computed(() => HTML_LANG[this.i18n.language()]);
  protected readonly recurrence = computed(() => this.subscription().recurrence);
  protected readonly title = computed(
    () =>
      this.recurrence().description?.trim() ||
      this.recurrence().category.name ||
      this.t().recurrences.types[this.recurrence().type],
  );
  protected readonly frequency = computed(() =>
    frequencyText(this.recurrence(), this.t().recurrences),
  );
  protected readonly channel = computed(() => {
    const channel = this.recurrence().channel?.trim();
    return channel ? interpolate(this.t().subscriptions.row.channel, { channel }) : null;
  });
  protected readonly foreign = computed(() => isForeign(this.recurrence()));
  protected readonly iof = computed(() => {
    const bps = this.recurrence().iofBps;
    return bps === null ? null : formatBps(bps, this.locale());
  });
  protected readonly company = computed(() => this.recurrence().scope === 'COMPANY');
  protected readonly canAct = computed(
    () => this.recurrence().active && !this.subscription().ended,
  );
  protected readonly activeUntil = computed(() => {
    const date = this.recurrence().activeUntil ?? this.recurrence().endDate;
    return date === null
      ? null
      : interpolate(this.t().subscriptions.row.activeUntil, {
          date: formatIsoDate(date, this.locale(), 'long'),
        });
  });
  protected readonly lastUsed = computed(() => {
    const date = this.recurrence().lastUsedOn;
    return date === null
      ? null
      : interpolate(this.t().subscriptions.row.lastUsed, {
          date: formatIsoDate(date, this.locale(), 'long'),
        });
  });
  protected readonly next = computed(() => {
    const date = this.recurrence().nextOccurrence;
    return date === null
      ? this.t().subscriptions.row.noNext
      : interpolate(this.t().subscriptions.row.next, {
          date: formatIsoDate(date, this.locale(), 'long'),
        });
  });
  protected readonly canCharge = computed(
    () => this.canAct() && this.recurrence().nextOccurrence !== null,
  );
  protected readonly chargeLabel = computed(() =>
    interpolate(this.t().subscriptions.row.chargeLabel, { name: this.title() }),
  );
  protected readonly cancelLabel = computed(() =>
    interpolate(this.t().subscriptions.row.cancelLabel, { name: this.title() }),
  );
}

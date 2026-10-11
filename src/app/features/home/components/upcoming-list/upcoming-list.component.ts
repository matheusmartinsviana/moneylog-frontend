import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DisclosureComponent } from '~/app/common/components/disclosure/disclosure.component';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import {
  Upcoming,
  UPCOMING_BUCKETS,
  UpcomingBucket,
  UpcomingItem,
} from '~/modules/dashboard/core/types/upcoming';
import { formatIsoDate } from '~/util/date';

interface ItemView {
  readonly item: UpcomingItem;
  readonly kind: string;
  readonly due: string | null;
  readonly debtLink: readonly string[] | null;
  readonly realizable: boolean;
  readonly incoming: boolean;
  readonly realizeLabel: string;
}

interface GroupView {
  readonly key: UpcomingBucket | 'UNDATED';
  readonly label: string;
  readonly items: readonly ItemView[];
}

@Component({
  selector: 'app-upcoming-list',
  imports: [RouterLink, MoneyComponent, DisclosureComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './upcoming-list.component.html',
  styleUrl: './upcoming-list.component.css',
})
export class UpcomingListComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly upcoming = input.required<Upcoming>();
  readonly realize = output<UpcomingItem>();

  protected readonly hasItems = computed(
    () => this.upcoming().items.length > 0 || this.upcoming().undated.length > 0,
  );

  protected readonly hasRecurrence = computed(() =>
    [...this.upcoming().items, ...this.upcoming().undated].some(
      (item) => item.refType === 'RECURRENCE',
    ),
  );

  protected readonly groups = computed<readonly GroupView[]>(() => {
    const copy = this.t().home.upcoming;
    const locale = HTML_LANG[this.i18n.language()];
    const view = (item: UpcomingItem): ItemView => ({
      item,
      kind: copy.kinds[item.kind],
      due: item.dueDate
        ? interpolate(copy.due, { date: formatIsoDate(item.dueDate, locale) })
        : null,
      debtLink:
        item.refId && item.refType === 'DEBT'
          ? ['/debts', item.refId]
          : item.refId && item.refType === 'TRANSACTION'
            ? ['/transactions', item.refId]
            : null,
      realizable: item.refType === 'RECURRENCE' && item.refId !== null && item.dueDate !== null,
      incoming: item.direction === 'IN',
      realizeLabel: interpolate(copy.realizeLabel, { label: item.label }),
    });
    const { items, undated } = this.upcoming();
    const dated: GroupView[] = UPCOMING_BUCKETS.map((bucket) => ({
      key: bucket,
      label: copy.buckets[bucket],
      items: items.filter((item) => item.bucket === bucket).map(view),
    }));
    const orphans = items.filter((item) => !UPCOMING_BUCKETS.some((b) => b === item.bucket));
    const withoutDate: GroupView = {
      key: 'UNDATED',
      label: copy.undated,
      items: [...orphans, ...undated].map(view),
    };
    return [...dated, withoutDate].filter((group) => group.items.length > 0);
  });
}

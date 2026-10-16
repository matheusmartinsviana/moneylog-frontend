import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EmptyStateComponent } from '~/app/common/components/empty-state/empty-state.component';
import type { EmptyStateAction } from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { IconComponent } from '~/app/common/components/icon/icon.component';
import type { IconName } from '~/app/common/components/icon/icons';
import { MoneyComponent } from '~/app/common/components/money/money.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import type { RecentActivityState } from '~/modules/transactions/core/facades/recent-activity.facade';
import type { ActivityIcon, ActivityItem } from '~/modules/transactions/core/types/activity';
import { formatIsoDate } from '~/util/date';
import type { Money } from '~/util/money';

const ICON: Readonly<Record<ActivityIcon, IconName>> = {
  'arrow-out': 'arrowOut',
  'arrow-in': 'arrowIn',
  'arrow-return': 'arrowReturn',
  'arrows-opposite': 'arrowsOpposite',
  card: 'cards',
  chart: 'chart',
  person: 'person',
  adjust: 'adjust',
  generic: 'generic',
};

const SIGN_SYMBOL = { plus: '+', minus: '−', none: '' } as const;

interface RowView {
  readonly item: ActivityItem;
  readonly icon: IconName;
  readonly kind: string;
  readonly category: string;
  readonly date: string;
  readonly sign: string;
  readonly direction: string | null;
  readonly amount: Money;
  readonly installments: string | null;
}

@Component({
  selector: 'app-recent-activity',
  imports: [RouterLink, IconComponent, MoneyComponent, EmptyStateComponent, ErrorStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recent-activity.component.html',
  styleUrl: './recent-activity.component.css',
})
export class RecentActivityComponent {
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;

  readonly state = input.required<RecentActivityState>();
  readonly maskable = input(true);
  readonly retry = output<void>();

  protected readonly problem = computed(() => {
    const state = this.state();
    return state.status === 'error' ? state.problem : null;
  });

  protected readonly emptyActions = computed<readonly EmptyStateAction[]>(() => [
    {
      id: 'register',
      label: this.t().home.recent.register,
      available: true,
      primary: true,
      link: '/quick-add',
    },
  ]);

  protected readonly rows = computed<readonly RowView[]>(() => {
    const state = this.state();
    if (state.status !== 'ready') return [];
    const copy = this.t().home.recent;
    const locale = HTML_LANG[this.i18n.language()];
    return state.items.map((item) => ({
      item,
      icon: ICON[item.icon],
      kind: copy.kinds[item.labelKey],
      category: item.category ?? copy.uncategorized,
      date: formatIsoDate(item.date, locale),
      sign: SIGN_SYMBOL[item.sign],
      direction:
        item.sign === 'plus' ? copy.incoming : item.sign === 'minus' ? copy.outgoing : null,
      amount: { ...item.amount, amount: item.amount.amount.replace(/^-/, '') },
      installments:
        item.installmentsTotal === null
          ? null
          : interpolate(copy.installments, { total: String(item.installmentsTotal) }),
    }));
  });
}

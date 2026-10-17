import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '~/app/common/components/icon/icon.component';
import type { IconName } from '~/app/common/components/icon/icons';
import { TooltipDirective } from '~/app/common/components/tooltip/tooltip.directive';
import { I18nService } from '~/app/common/i18n/i18n.service';

interface QuickAction {
  readonly id: string;
  readonly label: string;
  readonly icon: IconName;
  readonly link: string;
  readonly query?: Readonly<Record<string, string>>;
}

@Component({
  selector: 'app-quick-actions',
  imports: [IconComponent, RouterLink, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="qa" [attr.aria-label]="t().home.quick.title" data-cy="home-quick-actions">
      @for (action of actions(); track action.id) {
        <a
          class="qa__item"
          [routerLink]="action.link"
          [queryParams]="action.query"
          [attr.aria-label]="action.label"
          [appTooltip]="action.label"
          [attr.data-cy]="'home-quick-' + action.id"
        >
          <app-icon [name]="action.icon" [size]="18" />
          <span class="qa__label">{{ action.label }}</span>
        </a>
      }
    </nav>
  `,
  styleUrl: './quick-actions.component.css',
})
export class QuickActionsComponent {
  protected readonly t = inject(I18nService).t;

  protected readonly actions = computed<readonly QuickAction[]>(() => {
    const copy = this.t().home.quick;
    return [
      {
        id: 'transfer',
        label: copy.transfer,
        icon: 'arrowsOpposite',
        link: '/quick-add',
        query: { mode: 'transfer' },
      },
      { id: 'invoice', label: copy.payInvoice, icon: 'cards', link: '/cards' },
      { id: 'summary', label: copy.monthSummary, icon: 'chart', link: '/planning/summary' },
    ];
  });
}

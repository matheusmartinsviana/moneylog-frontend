import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { BOTTOM_NAV_ITEMS, BottomNavKey } from '~/app/common/components/app-shell/navigation';
import { IconComponent } from '~/app/common/components/icon/icon.component';
import { I18nService } from '~/app/common/i18n/i18n.service';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.css',
})
export class BottomNavComponent {
  protected readonly t = inject(I18nService).t;
  protected readonly items = BOTTOM_NAV_ITEMS;

  protected labelOf(key: string) {
    return this.t().shell.bottomNavLabels[key as BottomNavKey];
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { ShortcutGuideComponent } from '~/app/features/settings/components/shortcut-guide/shortcut-guide.component';

@Component({
  selector: 'app-shortcut-guide-page',
  imports: [RouterLink, PageLayoutComponent, ShortcutGuideComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-layout
      reading
      [heading]="t().quickEntry.guide.heading"
      [description]="t().quickEntry.guide.description"
    >
      <a
        pageActions
        class="link-more hit-area"
        routerLink="/settings/shortcuts"
        data-cy="shortcut-guide-back"
      >
        {{ t().quickEntry.guide.back }}
      </a>
      <app-shortcut-guide />
    </app-page-layout>
  `,
})
export class ShortcutGuidePage {
  protected readonly t = inject(I18nService).t;
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { SectionContainerComponent } from '~/app/common/components/section-container/section-container.component';
import { I18nService } from '~/app/common/i18n/i18n.service';

@Component({
  selector: 'app-shortcut-guide',
  imports: [SectionContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shortcut-guide.component.html',
  styleUrl: './shortcut-guide.component.css',
})
export class ShortcutGuideComponent {
  protected readonly t = inject(I18nService).t;
}

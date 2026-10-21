import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';

@Component({
  selector: 'app-shortcut-guide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shortcut-guide.component.html',
  styleUrl: './shortcut-guide.component.css',
})
export class ShortcutGuideComponent {
  protected readonly t = inject(I18nService).t;
  private readonly location = inject(DOCUMENT).location;

  protected readonly guide = computed(() => {
    const base = this.t().quickEntry.guide;
    const values = { origin: this.location.origin, host: this.location.host };
    return {
      ...base,
      steps: base.steps.map((step) => interpolate(step, values)),
      actions: base.actions.map((action) => ({
        title: action.title,
        detail: interpolate(action.detail, values),
      })),
    };
  });
}

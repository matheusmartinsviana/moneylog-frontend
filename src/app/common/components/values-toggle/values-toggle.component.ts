import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { ValuesVisibilityService } from '~/app/common/services/values-visibility.service';

@Component({
  selector: 'app-values-toggle',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="icon-button values-toggle"
      data-cy="values-toggle"
      [attr.aria-pressed]="hidden()"
      [attr.aria-label]="label()"
      (click)="visibility.toggle()"
    >
      <app-icon [name]="hidden() ? 'eyeOff' : 'eye'" [size]="20" />
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .values-toggle:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
  `,
})
export class ValuesToggleComponent {
  protected readonly visibility = inject(ValuesVisibilityService);
  private readonly i18n = inject(I18nService);

  protected readonly hidden = this.visibility.hidden;
  protected readonly label = computed(() => this.i18n.t().glass.values.hide);
}

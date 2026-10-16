import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { formatRatio, ratioSign } from '~/util/ratio';

@Component({
  selector: 'app-trend-badge',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="trend" [attr.data-cy]="cy()" [attr.data-direction]="view().direction">
      @if (view().icon; as icon) {
        <app-icon [name]="icon" [size]="14" />
      }
      @if (view().text; as text) {
        <span class="num trend__value">{{ text }}</span>
        <span class="visually-hidden">{{ view().announce }}</span>
      } @else {
        <span class="trend__none" data-cy="trend-none">{{ view().announce }}</span>
      }
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .trend {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: 0 var(--space-2);
      border: var(--border-width) solid var(--glass-panel-border);
      border-radius: var(--radius-pill);
      color: var(--color-neutral-text);
      font-size: var(--text-xs);
      line-height: var(--leading-tight);
      min-height: 1.5rem;
      white-space: nowrap;
    }

    .trend__value {
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class TrendBadgeComponent {
  private readonly i18n = inject(I18nService);

  readonly ratio = input.required<string | null>();
  readonly cy = input('trend-badge');

  protected readonly view = computed(() => {
    const copy = this.i18n.t().glass.trend;
    const ratio = this.ratio();
    if (ratio === null) {
      return { direction: 'none', icon: null, text: null, announce: copy.none } as const;
    }
    const locale = HTML_LANG[this.i18n.language()];
    const text = formatRatio(ratio, locale, { signed: true });
    switch (ratioSign(ratio)) {
      case 'up':
        return { direction: 'up', icon: 'arrowUp', text, announce: copy.up } as const;
      case 'down':
        return { direction: 'down', icon: 'arrowDown', text, announce: copy.down } as const;
      default:
        return { direction: 'flat', icon: 'minus', text, announce: copy.flat } as const;
    }
  });
}

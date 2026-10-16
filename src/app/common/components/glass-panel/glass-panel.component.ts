import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type GlassPanelVariant = 'window' | 'card' | 'control' | 'wallet';

@Component({
  selector: 'app-glass-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'glass-panel',
    '[class.glass-panel--strong]': 'strong()',
    '[class.glass-panel--flat]': 'flat()',
    '[class.glass-panel--card]': "variant() === 'card'",
    '[class.glass-panel--control]': "variant() === 'control'",
    '[class.glass-panel--wallet]': "variant() === 'wallet'",
  },
  template: `<ng-content />`,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
  `,
})
export class GlassPanelComponent {
  readonly variant = input<GlassPanelVariant>('window');
  readonly strong = input(false);
  readonly flat = input(false);
}

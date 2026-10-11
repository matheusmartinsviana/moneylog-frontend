import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-gauge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gauge" data-cy="gauge">
      <svg class="gauge__svg" viewBox="0 0 200 108" aria-hidden="true" focusable="false">
        <path class="gauge__track" [attr.d]="path" pathLength="100" />
        @if (arc(); as value) {
          <path
            class="gauge__arc"
            [attr.d]="path"
            pathLength="100"
            [attr.stroke-dasharray]="value + ' 100'"
            data-cy="gauge-arc"
          />
        }
      </svg>
      <div class="gauge__content"><ng-content /></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }

    .gauge {
      position: relative;
      width: 100%;
      max-width: 15rem;
      margin-inline: auto;
      aspect-ratio: 200 / 108;
    }

    .gauge__svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .gauge__track,
    .gauge__arc {
      fill: none;
      stroke-width: 10;
      stroke-linecap: round;
    }

    .gauge__track {
      stroke: var(--color-surface-muted);
      opacity: 0.9;
    }

    .gauge__arc {
      stroke: var(--color-accent);
    }

    .gauge__content {
      position: absolute;
      right: 16%;
      bottom: 0;
      left: 16%;
      display: grid;
      justify-items: center;
      text-align: center;
    }

    @media (forced-colors: active) {
      .gauge__arc {
        stroke: Highlight;
      }

      .gauge__track {
        stroke: GrayText;
      }
    }
  `,
})
export class GaugeComponent {
  readonly share = input<number | null>(null);

  protected readonly path = 'M 15 100 A 85 85 0 0 1 185 100';
  protected readonly arc = computed(() => {
    const share = this.share();
    return share === null || !(share > 0) ? null : Math.min(100, share);
  });
}

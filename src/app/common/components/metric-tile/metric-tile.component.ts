import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-metric-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tile" [attr.data-cy]="cy()">
      <span class="tile__label">{{ label() }}</span>
      <span class="tile__value num"><ng-content /></span>
      <span class="tile__extra"><ng-content select="[tileExtra]" /></span>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .tile {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      min-width: 0;
    }

    .tile__label {
      color: var(--color-home-text-muted);
      font-size: var(--text-xs);
      line-height: var(--leading-tight);
    }

    .tile__value {
      color: var(--color-home-text);
      font-size: var(--text-xl);
      font-weight: var(--weight-semibold);
      font-variant-numeric: tabular-nums;
      overflow-wrap: anywhere;
    }

    .tile__extra:empty {
      display: none;
    }

    .tile__extra {
      color: var(--color-home-text-muted);
      font-size: var(--text-xs);
    }
  `,
})
export class MetricTileComponent {
  readonly label = input.required<string>();
  readonly cy = input('metric-tile');
}

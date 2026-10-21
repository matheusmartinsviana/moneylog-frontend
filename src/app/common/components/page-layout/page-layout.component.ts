import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

import { MotionStaggerDirective } from '~/app/common/motion/motion-stagger.directive';

@Component({
  selector: 'app-page-layout',
  imports: [MotionStaggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.fit]': 'fit()',
    '[attr.data-fit-page]': "fit() ? '' : null",
    '[class.reading]': 'reading()',
  },
  template: `
    <main id="main-content" class="page m-page" tabindex="-1" data-cy="page">
      <header class="page__header" data-cy="page-header">
        <div class="page__heading">
          <h1 class="page__title" data-cy="page-title">
            <bdi>{{ heading() }}</bdi>
          </h1>
        </div>
        <div class="page__actions">
          <ng-content select="[pageActions]" />
        </div>
      </header>
      @if (description()) {
        <p class="page__description" data-cy="page-description">{{ description() }}</p>
      }
      <div class="page__content" appStagger [appStaggerOffset]="1" data-cy="page-content">
        <ng-content />
      </div>
    </main>
  `,
  styles: `
    :host {
      display: block;
    }

    .page {
      display: grid;
      gap: var(--page-gap);
      width: 100%;
      max-width: var(--page-max-width);
      margin: 0 auto;
      padding: 0 var(--page-gutter) var(--page-pad-bottom);
    }

    .page__header {
      position: sticky;
      top: 0;
      z-index: var(--z-sticky);
      isolation: isolate;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2) var(--space-3);
      min-height: var(--page-header-height);
      margin-inline: calc(var(--page-gutter) * -1);
      padding: var(--page-pad-top) var(--page-gutter);
    }

    .page__header::before {
      content: '';
      position: absolute;
      inset: 0 0 calc(var(--space-8) * -1);
      z-index: -1;
      background: var(--gradient-header-veil);
      pointer-events: none;
    }

    @supports (animation-timeline: scroll()) {
      .page__header::before {
        opacity: 0;
        animation: page-header-veil var(--duration-fast) linear both;
        animation-timeline: scroll(nearest block);
        animation-range: 0 1.5rem;
      }
    }

    @keyframes page-header-veil {
      to {
        opacity: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .page__header::before {
        animation-duration: 1ms;
      }
    }

    .page__heading {
      display: grid;
      flex: 1 1 8rem;
      min-width: 0;
    }

    .page__title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .page__description {
      margin-top: calc(var(--page-gap) * -0.5);
      color: var(--color-text-muted);
      font-size: var(--text-sm);
      text-wrap: pretty;
    }

    .page__actions {
      display: flex;
      flex: 0 1 auto;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
      justify-content: flex-end;
      max-width: 100%;
    }

    .page__actions:empty {
      display: none;
    }

    .page__content {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--section-gap);
      min-width: 0;
    }

    :host(.reading) .page__content {
      width: 100%;
      max-width: var(--reading-max-width);
    }

    :host(.fit) .page {
      gap: var(--space-3);
      padding-bottom: var(--space-3);
    }

    :host(.fit) .page__title {
      font-size: var(--text-xl);
    }

    :host(.fit) .page__content {
      row-gap: 0;
      min-height: 0;
    }
  `,
})
export class PageLayoutComponent {
  readonly heading = input.required<string>();
  readonly description = input<string>();
  readonly fit = input(false, { transform: booleanAttribute });
  readonly reading = input(false, { transform: booleanAttribute });
}

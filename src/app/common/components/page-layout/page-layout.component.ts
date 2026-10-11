import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

import { MotionRevealDirective } from '~/app/common/motion/motion-reveal.directive';
import { MotionStaggerDirective } from '~/app/common/motion/motion-stagger.directive';

@Component({
  selector: 'app-page-layout',
  imports: [MotionRevealDirective, MotionStaggerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.fit]': 'fit()',
    '[attr.data-fit-page]': "fit() ? '' : null",
    '[class.reading]': 'reading()',
  },
  template: `
    <main id="main-content" class="page m-page" tabindex="-1" data-cy="page">
      <header class="page__header" [appReveal]="0">
        <div class="page__heading">
          <h1 class="page__title" data-cy="page-title">
            <bdi>{{ heading() }}</bdi>
          </h1>
          @if (description()) {
            <p class="page__description" data-cy="page-description">{{ description() }}</p>
          }
        </div>
        <div class="page__actions">
          <ng-content select="[pageActions]" />
        </div>
      </header>
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
      padding: var(--page-pad-top) var(--page-gutter) var(--page-pad-bottom);
    }

    .page__header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--space-3);
    }

    .page__heading {
      display: grid;
      gap: var(--space-1);
      min-width: 0;
    }

    .page__description {
      color: var(--color-text-muted);
    }

    .page__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      justify-content: flex-end;
    }

    .page__actions:empty {
      display: none;
    }

    @media (width < 40rem) {
      .page__header:has(.page__actions .button ~ .button),
      :host(.fit) .page__header:has(.page__actions .button ~ .button) {
        flex-direction: column;
        flex-wrap: nowrap;
        align-items: stretch;
        gap: var(--space-2);
      }

      .page__header:has(.page__actions .button ~ .button) .page__actions {
        justify-content: stretch;
        width: 100%;
      }
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

    :host(.fit) {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      min-height: 0;
    }

    :host(.fit) .page {
      flex: 1 1 auto;
      grid-template-rows: auto minmax(0, 1fr);
      gap: var(--space-3);
      min-height: 0;
      padding-top: var(--space-2);
      padding-bottom: var(--space-3);
    }

    :host(.fit) .page__header {
      flex-wrap: nowrap;
      align-items: center;
    }

    :host(.fit) .page__heading {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0 var(--space-3);
    }

    :host(.fit) .page__title {
      font-size: var(--text-xl);
    }

    :host(.fit) .page__description {
      font-size: var(--text-sm);
    }

    @media (width < 30rem) {
      :host(.fit) .page__description {
        display: none;
      }
    }

    :host(.fit) .page__content {
      grid-template-rows: minmax(0, 1fr);
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

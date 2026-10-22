import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
} from '@angular/core';

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

    :host(.under-header) .page__description,
    :host(.under-header) .page__content {
      --page-fade-ramp: 2.75rem;
      mask-image: var(--mask-under-header);
      mask-size:
        100% calc(var(--fade-solid) + var(--page-fade-ramp)),
        100% 100%;
      mask-position:
        0 var(--fade-top),
        0 calc(var(--fade-top) + var(--fade-solid) + var(--page-fade-ramp));
      mask-repeat: no-repeat;
    }

    @supports (animation-timeline: scroll()) {
      :host(.under-header) .page__description,
      :host(.under-header) .page__content {
        animation: page-scroll-offset var(--duration-fast) linear both;
        animation-timeline: scroll(nearest block);
        animation-range: 0px 100000px;
        mask-position:
          0 calc(var(--fade-base) + var(--page-scroll-offset)),
          0
            calc(
              var(--fade-base) + var(--page-scroll-offset) + var(--fade-solid) +
                var(--page-fade-ramp)
            );
      }
    }

    @keyframes page-scroll-offset {
      to {
        --page-scroll-offset: 100000px;
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
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly heading = input.required<string>();
  readonly description = input<string>();
  readonly fit = input(false, { transform: booleanAttribute });
  readonly reading = input(false, { transform: booleanAttribute });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const header = this.host.querySelector<HTMLElement>('.page__header');
      const scroller = this.scrollParent();
      if (!header || !scroller) return;
      let frame = 0;
      const update = () => {
        frame = 0;
        const bounds = header.getBoundingClientRect();
        this.host.classList.toggle('under-header', scroller.scrollTop > 1);
        for (const target of this.host.querySelectorAll<HTMLElement>(
          '.page__description, .page__content',
        )) {
          target.style.setProperty(
            '--fade-top',
            `${bounds.top - target.getBoundingClientRect().top}px`,
          );
          target.style.setProperty('--fade-solid', `${bounds.height}px`);
          target.style.setProperty(
            '--fade-base',
            `${bounds.top - target.getBoundingClientRect().top - scroller.scrollTop}px`,
          );
        }
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      scroller.addEventListener('scroll', schedule, { passive: true });
      const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
      resize?.observe(header);
      update();
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        scroller.removeEventListener('scroll', schedule);
        resize?.disconnect();
      });
    });
  }

  private scrollParent(): HTMLElement | null {
    for (let node = this.host.parentElement; node; node = node.parentElement) {
      const overflowY = getComputedStyle(node).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') return node;
    }
    return null;
  }
}

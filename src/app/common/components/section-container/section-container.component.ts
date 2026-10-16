import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'app-section-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.fill]': 'fill()' },
  template: `
    <section
      class="section glass-panel"
      [class.lift]="interactive()"
      [class.section--glow]="glow()"
      [class.glass]="glow()"
      [class.glass-panel--flat]="!glow()"
      [class.glass--strong]="glow()"
      [class.section--fill]="fill()"
      [class.section--dense]="dense()"
      [class.section--scroll]="scroll()"
      [attr.aria-labelledby]="headingId"
      data-cy="section"
    >
      <header class="section__header">
        <div class="section__heading">
          <h2 class="section__title" [id]="headingId">{{ heading() }}</h2>
          @if (description()) {
            <p class="section__description">{{ description() }}</p>
          }
        </div>
        <div class="section__actions">
          <ng-content select="[sectionActions]" />
        </div>
      </header>
      <div class="section__body">
        <ng-content />
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .section {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-5);
      border-radius: var(--radius-rail);
    }

    .section--glow {
      background-image: var(--glass-sheen), var(--gradient-panel-glow);
    }

    :host(.fill) {
      height: 100%;
      min-height: 0;
    }

    .section--dense {
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
    }

    .section--dense .section__title {
      font-size: var(--text-md);
    }

    .section--dense .section__body {
      gap: var(--space-2);
    }

    @container (width < 40rem) {
      .section--dense .section__title {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
      }
    }

    .section--fill {
      grid-template-rows: auto minmax(0, 1fr);
      height: 100%;
      min-height: 0;
    }

    .section--fill .section__body {
      grid-template-rows: auto minmax(0, 1fr);
      min-height: 0;
    }

    .section--fill.section--scroll .section__body {
      position: relative;
      grid-template-rows: none;
      overflow-y: auto;
    }

    @media (hover: hover) {
      .section.lift:hover {
        box-shadow: var(--glass-panel-shadow-strong);
      }
    }

    .section__header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2) var(--space-3);
    }

    .section__heading {
      display: grid;
      gap: var(--space-1);
      min-width: 0;
    }

    .section__actions:empty {
      display: none;
    }

    .section__description {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .section__body {
      display: grid;
      gap: var(--space-4);
    }
  `,
})
export class SectionContainerComponent {
  readonly heading = input.required<string>();
  readonly description = input<string>();
  readonly interactive = input(false, { transform: booleanAttribute });
  readonly glow = input(false, { transform: booleanAttribute });
  readonly fill = input(false, { transform: booleanAttribute });
  readonly scroll = input(false, { transform: booleanAttribute });
  readonly dense = input(false, { transform: booleanAttribute });

  protected readonly headingId = `section-title-${++nextId}`;
}

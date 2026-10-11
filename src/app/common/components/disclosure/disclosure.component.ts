import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  signal,
  untracked,
} from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';

let nextId = 0;

@Component({
  selector: 'app-disclosure',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="disclosure" [class.is-open]="open()" [attr.data-cy]="fieldId()">
      @if (!hideHeader()) {
        <div role="heading" [attr.aria-level]="headingLevel()">
          <button
            type="button"
            class="disclosure__header"
            [id]="headerId"
            [attr.aria-expanded]="open()"
            [attr.aria-controls]="regionId"
            [attr.data-cy]="fieldId() + '-toggle'"
            (click)="toggle()"
          >
            <span class="disclosure__title">{{ heading() }}</span>
            @if (summary(); as text) {
              <span class="disclosure__summary">{{ text }}</span>
            }
            <app-icon class="disclosure__icon" name="chevronDown" [size]="18" />
          </button>
        </div>
      }
      <div
        class="disclosure__region"
        role="region"
        [id]="regionId"
        [attr.aria-labelledby]="hideHeader() ? null : headerId"
        [attr.aria-label]="hideHeader() ? heading() : null"
        [attr.inert]="open() ? null : ''"
      >
        <div class="disclosure__inner">
          @if (!lazy() || open() || rendered()) {
            <ng-content />
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .disclosure__header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      width: 100%;
      min-height: 2.75rem;
      padding: 0;
      border: 0;
      border-radius: var(--radius-control);
      background: transparent;
      color: var(--color-text);
      font-weight: var(--weight-medium);
      text-align: left;
      -webkit-tap-highlight-color: transparent;
    }

    .disclosure__title {
      flex: 1;
      min-width: 0;
    }

    .disclosure__summary {
      color: var(--color-text-muted);
      font-size: var(--text-xs);
      font-weight: var(--weight-regular);
    }

    .disclosure__icon {
      color: var(--color-text-muted);
      transition: transform var(--duration-fast) var(--ease-standard);
    }

    .is-open > .disclosure__header .disclosure__icon {
      transform: rotate(180deg);
    }

    .disclosure__region {
      display: grid;
      grid-template-rows: 0fr;
      visibility: hidden;
      transition:
        grid-template-rows var(--duration-base) var(--ease-standard),
        visibility 0s linear var(--duration-base);
    }

    .is-open > .disclosure__region {
      grid-template-rows: 1fr;
      visibility: visible;
      transition-delay: 0s;
    }

    .disclosure__inner {
      position: relative;
      min-height: 0;
      margin: calc(var(--space-1) * -1);
      padding: var(--space-1);
      overflow: hidden;
    }
  `,
})
export class DisclosureComponent {
  readonly heading = input.required<string>();
  readonly summary = input<string>();
  readonly fieldId = input.required<string>();
  readonly open = model(false);
  readonly headingLevel = input(2);
  readonly lazy = input(false);
  readonly hideHeader = input(false);

  private readonly uid = ++nextId;
  protected readonly headerId = `disclosure-header-${this.uid}`;
  protected readonly regionId = `disclosure-region-${this.uid}`;
  private readonly everOpened = signal(false);
  protected readonly rendered = computed(() => this.everOpened());

  constructor() {
    effect(() => {
      if (this.open()) untracked(() => this.everOpened.set(true));
    });
  }

  protected toggle(): void {
    this.open.set(!this.open());
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
} from '@angular/core';

export interface SegmentedOption {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'app-segmented-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg" role="radiogroup" [attr.aria-label]="label()" [attr.data-cy]="cy()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          class="seg__option"
          role="radio"
          [class.is-selected]="option.value === selected()"
          [attr.aria-checked]="option.value === selected()"
          [attr.tabindex]="option.value === tabbable() ? 0 : -1"
          [attr.data-cy]="cy() + '-' + option.value"
          (click)="select(option.value)"
          (keydown)="onKeydown($event, option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: inline-flex;
      max-width: 100%;
    }

    .seg {
      display: inline-flex;
      gap: var(--space-1);
      padding: var(--space-1);
      border: var(--border-width) solid var(--glass-panel-border);
      border-radius: var(--radius-control);
      background-color: var(--glass-panel-solid);
    }

    .seg__option {
      min-height: 2.25rem;
      padding: 0 var(--space-3);
      border: 0;
      border-radius: calc(var(--radius-control) - var(--space-1) / 2);
      background: transparent;
      color: var(--color-home-text-muted);
      font: inherit;
      font-size: var(--text-sm);
      cursor: pointer;
    }

    .seg__option.is-selected {
      background-color: var(--glass-panel-solid-strong);
      color: var(--color-home-text);
      font-weight: var(--weight-medium);
    }

    .seg__option:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    @media (width <= 640px), (pointer: coarse) {
      .seg__option {
        min-height: var(--touch-min);
      }
    }
  `,
})
export class SegmentedToggleComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly options = input.required<readonly SegmentedOption[]>();
  readonly value = model.required<string>();
  readonly label = input.required<string>();
  readonly cy = input('segmented-toggle');

  protected readonly selected = this.value;
  protected readonly tabbable = computed(() => {
    const options = this.options();
    return options.some((o) => o.value === this.value()) ? this.value() : options[0]?.value;
  });

  protected select(value: string): void {
    this.value.set(value);
  }

  protected onKeydown(event: KeyboardEvent, current: string): void {
    const options = this.options();
    const index = options.findIndex((o) => o.value === current);
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (index + 1) % options.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (index - 1 + options.length) % options.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = options.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.select(current);
        return;
      default:
        return;
    }
    event.preventDefault();
    const target = options[next];
    if (!target) return;
    this.select(target.value);
    this.host.nativeElement.querySelectorAll<HTMLElement>('[role="radio"]').item(next)?.focus();
  }
}

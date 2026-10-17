import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';

import { FieldControl } from '~/app/common/components/forms/field-control';
import { FieldErrorComponent } from '~/app/common/components/forms/field-error/field-error.component';
import { IconComponent } from '~/app/common/components/icon/icon.component';
import { I18nService } from '~/app/common/i18n/i18n.service';

const HOLD_DELAY_MS = 400;
const HOLD_INTERVALS_MS = [160, 100, 60, 40] as const;
const HOLD_ACCELERATE_EVERY = 6;
const MAX_DIGITS = 9;

@Component({
  selector: 'app-number-stepper',
  imports: [FieldErrorComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberStepperComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NumberStepperComponent),
      multi: true,
    },
  ],
  template: `
    <div class="field">
      <label class="field__label" [id]="labelId()" [for]="controlId()">{{ label() }}</label>
      <div class="stepper" [class.is-disabled]="disabled()" [class.is-invalid]="showError()">
        <button
          type="button"
          class="stepper__button"
          tabindex="-1"
          [attr.aria-label]="t().form.stepper.decrease"
          [attr.aria-controls]="controlId()"
          [attr.aria-disabled]="!canDecrease() || null"
          [disabled]="disabled()"
          [attr.data-cy]="fieldId() + '-decrease'"
          (pointerdown)="startHold($event, -1)"
          (pointerup)="endPointer()"
          (pointercancel)="endPointer()"
          (pointerleave)="stopHold()"
          (blur)="stopHold()"
          (click)="onButtonClick(-1)"
        >
          <app-icon name="minus" [size]="18" />
        </button>
        <input
          type="text"
          role="spinbutton"
          class="stepper__input"
          inputmode="numeric"
          autocomplete="off"
          spellcheck="false"
          [id]="controlId()"
          [attr.maxlength]="MAX_DIGITS + 1"
          [attr.aria-labelledby]="labelId()"
          [attr.aria-valuemin]="min()"
          [attr.aria-valuemax]="max()"
          [attr.aria-valuenow]="value()"
          [attr.aria-valuetext]="ariaValueText()"
          [attr.aria-required]="mandatory()"
          [attr.aria-invalid]="showError()"
          [attr.aria-describedby]="describedBy()"
          [attr.data-cy]="fieldId()"
          [value]="draft()"
          [disabled]="disabled()"
          (input)="onInput($event)"
          (keydown)="onKeydown($event)"
          (blur)="onBlur()"
        />
        <button
          type="button"
          class="stepper__button"
          tabindex="-1"
          [attr.aria-label]="t().form.stepper.increase"
          [attr.aria-controls]="controlId()"
          [attr.aria-disabled]="!canIncrease() || null"
          [disabled]="disabled()"
          [attr.data-cy]="fieldId() + '-increase'"
          (pointerdown)="startHold($event, 1)"
          (pointerup)="endPointer()"
          (pointercancel)="endPointer()"
          (pointerleave)="stopHold()"
          (blur)="stopHold()"
          (click)="onButtonClick(1)"
        >
          <app-icon name="plus" [size]="18" />
        </button>
      </div>
      @if (hint(); as text) {
        <p class="field__hint" [id]="hintId()">{{ text }}</p>
      }
      <app-field-error [control]="control()" [errorId]="errorId()" />
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .stepper {
      display: flex;
      align-items: stretch;
      width: 100%;
      max-width: 14rem;
      border: var(--border-width) solid var(--field-border);
      border-radius: var(--field-radius);
      background-color: var(--field-bg);
      box-shadow: var(--field-shadow);
      transition: border-color var(--duration-fast) var(--ease-standard);
    }

    .stepper:focus-within {
      border-color: var(--color-accent);
    }

    .stepper.is-invalid {
      border-color: var(--color-risk);
    }

    .stepper.is-disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .stepper__button {
      display: inline-grid;
      flex: none;
      place-items: center;
      width: 2.75rem;
      min-height: 2.75rem;
      border: 0;
      border-radius: calc(var(--radius-control) - 1px);
      background: transparent;
      color: var(--color-text);
      touch-action: manipulation;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    .stepper__button:hover:not(:disabled, [aria-disabled='true']) {
      background-color: var(--color-hover-soft);
    }

    .stepper__button[aria-disabled='true'] {
      color: var(--color-text-muted);
      opacity: 0.45;
    }

    .stepper__input {
      flex: 1;
      min-width: 0;
      padding: 0 var(--space-1);
      border: 0;
      background: transparent;
      color: var(--color-text);
      font-size: 1rem;
      font-variant-numeric: tabular-nums;
      text-align: center;
    }

    .stepper__input:focus-visible {
      outline: none;
    }

    .stepper:has(.stepper__input:focus-visible) {
      box-shadow: var(--focus-ring);
    }
  `,
})
export class NumberStepperComponent extends FieldControl<number | null> implements Validator {
  protected readonly t = inject(I18nService).t;
  private readonly destroyRef = inject(DestroyRef);
  protected readonly MAX_DIGITS = MAX_DIGITS;

  readonly min = input(0);
  readonly max = input<number | null>(null);
  readonly step = input(1);
  readonly mandatory = input(true);
  readonly valueText = input<((value: number) => string) | undefined>(undefined);

  protected readonly value = signal<number | null>(null);
  protected readonly draft = signal('');

  protected readonly ariaValueText = computed(() => {
    const value = this.value();
    const format = this.valueText();
    return value === null || !format ? null : format(value);
  });
  protected readonly canDecrease = computed(() => {
    const value = this.value();
    return value === null || value > this.min();
  });
  protected readonly canIncrease = computed(() => {
    const value = this.value();
    const max = this.max();
    return value === null || max === null || value < max;
  });

  private holdTimer: ReturnType<typeof setTimeout> | undefined;
  private pointerEndedAt = 0;

  constructor() {
    super();
    this.destroyRef.onDestroy(() => this.stopHold());
  }

  writeValue(value: number | null): void {
    const clean = value === null || !Number.isInteger(value) ? null : value;
    this.value.set(clean);
    this.draft.set(clean === null ? '' : String(clean));
  }

  validate(): ValidationErrors | null {
    return this.mandatory() && this.value() === null ? { required: true } : null;
  }

  private clamp(value: number): number {
    const max = this.max();
    return Math.min(max ?? value, Math.max(this.min(), value));
  }

  private commit(value: number | null): void {
    this.value.set(value);
    this.draft.set(value === null ? '' : String(value));
    this.onChange(value);
  }

  private stepBy(direction: 1 | -1, times = 1): boolean {
    if (this.disabled()) return false;
    const current = this.value();
    const base = current ?? this.min();
    const next =
      current === null ? this.clamp(base) : this.clamp(base + direction * this.step() * times);
    if (next === current) return false;
    this.commit(next);
    return true;
  }

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const negative = this.min() < 0 && input.value.trim().startsWith('-') ? '-' : '';
    const digits = input.value.replace(/\D/g, '').slice(0, MAX_DIGITS);
    const text = digits === '' ? negative : negative + digits;
    this.draft.set(text);
    input.value = text;
    if (/^-?\d+$/.test(text)) {
      const parsed = Number.parseInt(text, 10);
      if (parsed === this.clamp(parsed)) {
        this.value.set(parsed);
        this.onChange(parsed);
      }
    } else if (text === '' && !this.mandatory()) {
      this.value.set(null);
      this.onChange(null);
    }
  }

  protected onBlur(): void {
    this.stopHold();
    this.onTouched();
    this.normalize();
  }

  private normalize(): void {
    this.draft.set(this.value() === null ? '' : String(this.value()));
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const max = this.max();
    switch (event.key) {
      case 'ArrowUp':
        this.stepBy(1);
        break;
      case 'ArrowDown':
        this.stepBy(-1);
        break;
      case 'PageUp':
        this.stepBy(1, 10);
        break;
      case 'PageDown':
        this.stepBy(-1, 10);
        break;
      case 'Home':
        this.commit(this.min());
        break;
      case 'End':
        if (max === null) return;
        this.commit(max);
        break;
      case 'Enter':
        this.normalize();
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  protected onButtonClick(direction: 1 | -1): void {
    if (Date.now() - this.pointerEndedAt < 500) return;
    this.stepBy(direction);
  }

  protected endPointer(): void {
    this.pointerEndedAt = Date.now();
    this.stopHold();
  }

  protected startHold(event: PointerEvent, direction: 1 | -1): void {
    if (event.button !== 0 || this.disabled()) return;
    event.preventDefault();
    this.stopHold();
    let repeats = 0;
    const tick = (): void => {
      if (!this.stepBy(direction)) {
        this.stopHold();
        return;
      }
      repeats++;
      const level = Math.min(
        HOLD_INTERVALS_MS.length - 1,
        Math.floor(repeats / HOLD_ACCELERATE_EVERY),
      );
      this.holdTimer = setTimeout(tick, HOLD_INTERVALS_MS[level]);
    };
    this.stepBy(direction);
    this.holdTimer = setTimeout(tick, HOLD_DELAY_MS);
  }

  protected stopHold(): void {
    clearTimeout(this.holdTimer);
    this.holdTimer = undefined;
  }
}

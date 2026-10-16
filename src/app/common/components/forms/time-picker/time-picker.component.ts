import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  Injector,
  input,
  signal,
  untracked,
} from '@angular/core';
import { NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';

import { FieldControl } from '~/app/common/components/forms/field-control';
import { FieldErrorComponent } from '~/app/common/components/forms/field-error/field-error.component';
import { IconComponent } from '~/app/common/components/icon/icon.component';
import { OverlayPanelComponent } from '~/app/common/components/overlay/overlay-panel.component';
import { I18nService } from '~/app/common/i18n/i18n.service';

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HOURS: readonly number[] = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTE_STEP = 5;

type Column = 'hour' | 'minute';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

@Component({
  selector: 'app-time-picker',
  imports: [FieldErrorComponent, IconComponent, OverlayPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TimePickerComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => TimePickerComponent), multi: true },
  ],
  template: `
    <div class="field">
      <label class="field__label" [id]="labelId()" [for]="controlId()">{{ label() }}</label>
      <button
        #trigger
        type="button"
        role="combobox"
        class="input time-box"
        [id]="controlId()"
        [class.is-open]="open()"
        [disabled]="disabled()"
        aria-haspopup="dialog"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? panelId() : null"
        [attr.aria-required]="mandatory()"
        [attr.aria-invalid]="showError()"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-label]="label() + ': ' + (value() ?? t().form.time.placeholder)"
        [attr.data-cy]="fieldId()"
        (click)="toggle()"
      >
        <span class="time-box__value num" [class.is-placeholder]="value() === null">{{
          value() ?? t().form.time.placeholder
        }}</span>
        <app-icon name="time" [size]="20" />
      </button>

      <app-overlay-panel
        [open]="open()"
        [anchor]="trigger"
        [label]="t().form.time.choose"
        [cy]="fieldId() + '-panel'"
        align="end"
        [panelWidth]="288"
        (closed)="close()"
      >
        @if (open()) {
          <div class="time-panel" [id]="panelId()" [attr.data-cy]="fieldId() + '-columns'">
            <div
              class="time-col"
              role="listbox"
              [attr.aria-label]="t().form.time.hour"
              [attr.data-cy]="fieldId() + '-hours'"
            >
              @for (hour of hours; track hour) {
                <button
                  type="button"
                  role="option"
                  class="time-opt num"
                  [class.is-selected]="hour === selectedHour()"
                  [attr.aria-selected]="hour === selectedHour()"
                  [attr.tabindex]="hour === activeHour() ? 0 : -1"
                  [attr.data-autofocus]="hour === activeHour() ? '' : null"
                  [attr.data-cy]="fieldId() + '-hour-' + pad(hour)"
                  (click)="pickHour(hour)"
                  (keydown)="onKeydown($event, 'hour')"
                >
                  {{ pad(hour) }}
                </button>
              }
            </div>
            <div
              class="time-col"
              role="listbox"
              [attr.aria-label]="t().form.time.minute"
              [attr.data-cy]="fieldId() + '-minutes'"
            >
              @for (minute of minutes(); track minute) {
                <button
                  type="button"
                  role="option"
                  class="time-opt num"
                  [class.is-selected]="minute === selectedMinute()"
                  [attr.aria-selected]="minute === selectedMinute()"
                  [attr.tabindex]="minute === activeMinute() ? 0 : -1"
                  [attr.data-cy]="fieldId() + '-minute-' + pad(minute)"
                  (click)="pickMinute(minute)"
                  (keydown)="onKeydown($event, 'minute')"
                >
                  {{ pad(minute) }}
                </button>
              }
            </div>
          </div>
          <div class="time-actions">
            @if (!mandatory()) {
              <button
                type="button"
                class="time-shortcut"
                [attr.data-cy]="fieldId() + '-clear'"
                (click)="clear()"
              >
                {{ t().form.ui.clear }}
              </button>
            }
            <button
              type="button"
              class="time-shortcut time-shortcut--primary"
              [attr.data-cy]="fieldId() + '-done'"
              (click)="close()"
            >
              {{ t().form.time.done }}
            </button>
          </div>
        }
      </app-overlay-panel>

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

    .time-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      text-align: left;
      cursor: pointer;
    }

    .time-box:hover:not(:disabled) {
      border-color: var(--color-hover-border);
    }

    .time-box.is-open {
      border-color: var(--color-accent);
    }

    .time-box:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .time-box__value.is-placeholder {
      color: var(--color-text-muted);
    }

    .time-box app-icon {
      color: var(--color-text-muted);
    }

    .time-panel {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-2);
      padding: var(--space-3);
    }

    .time-col {
      display: grid;
      align-content: start;
      gap: 2px;
      max-height: 14rem;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 2px;
    }

    .time-opt {
      min-height: 2.5rem;
      padding: 0 var(--space-3);
      border: 0;
      border-radius: var(--radius-control);
      background: transparent;
      color: var(--color-text);
      font-size: var(--text-md);
      text-align: center;
    }

    .time-opt:hover {
      background-color: var(--color-hover-soft);
    }

    .time-opt.is-selected {
      background-color: var(--color-accent-soft);
      color: var(--color-accent);
      font-weight: var(--weight-semibold);
    }

    .time-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: 0 var(--space-3) var(--space-3);
    }

    .time-shortcut {
      min-height: 2.75rem;
      padding: 0 var(--space-4);
      border: var(--border-width) solid var(--field-border);
      border-radius: var(--radius-pill);
      background-color: var(--field-bg);
      color: var(--color-text);
      font-size: var(--text-sm);
      font-weight: var(--weight-medium);
    }

    .time-shortcut:hover {
      background-color: var(--color-hover-soft);
    }

    .time-shortcut--primary {
      border-color: transparent;
      background-color: var(--color-accent-soft);
      color: var(--color-accent);
    }

    @media (width >= 641px) {
      .time-shortcut {
        min-height: 2.25rem;
      }
    }
  `,
})
export class TimePickerComponent extends FieldControl<string | null> implements Validator {
  private readonly i18n = inject(I18nService);
  private readonly ngInjector = inject(Injector);
  protected readonly t = this.i18n.t;

  readonly mandatory = input(true);

  protected readonly hours = HOURS;
  protected readonly panelId = computed(() => `${this.controlId()}-panel`);
  protected readonly value = signal<string | null>(null);
  protected readonly open = signal(false);
  protected readonly selectedHour = computed(() => this.part(1));
  protected readonly selectedMinute = computed(() => this.part(2));
  protected readonly activeHour = signal(0);
  protected readonly activeMinute = signal(0);
  protected readonly minutes = computed(() => {
    const steps = Array.from({ length: 60 / MINUTE_STEP }, (_, index) => index * MINUTE_STEP);
    const current = this.selectedMinute();
    if (current === null || steps.includes(current)) return steps;
    return [...steps, current].sort((a, b) => a - b);
  });

  private validatorChange: () => void = () => undefined;
  private mandatoryApplied = false;

  constructor() {
    super();
    effect(() => {
      this.mandatory();
      if (this.mandatoryApplied) this.validatorChange();
      this.mandatoryApplied = true;
    });
    effect(() => {
      if (!this.open()) return;
      untracked(() => {
        this.activeHour.set(this.selectedHour() ?? 0);
        this.activeMinute.set(this.selectedMinute() ?? 0);
      });
      afterNextRender(() => this.centerSelected(), { injector: this.ngInjector });
    });
  }

  writeValue(value: string | null): void {
    this.value.set(typeof value === 'string' && TIME.test(value) ? value : null);
  }

  validate(): ValidationErrors | null {
    return this.value() === null && this.mandatory() ? { required: true } : null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.validatorChange = fn;
  }

  protected pad(value: number): string {
    return pad(value);
  }

  protected toggle(): void {
    if (this.disabled()) return;
    if (this.open()) this.close();
    else this.open.set(true);
  }

  protected close(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.onTouched();
  }

  protected pickHour(hour: number): void {
    this.activeHour.set(hour);
    this.apply(hour, this.selectedMinute() ?? 0);
  }

  protected pickMinute(minute: number): void {
    this.activeMinute.set(minute);
    this.apply(this.selectedHour() ?? 0, minute);
    this.close();
  }

  protected clear(): void {
    this.value.set(null);
    this.onChange(null);
    this.close();
  }

  protected onKeydown(event: KeyboardEvent, column: Column): void {
    const key = event.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return;
    event.preventDefault();
    const values = column === 'hour' ? this.hours : this.minutes();
    const current = column === 'hour' ? this.activeHour() : this.activeMinute();
    const index = Math.max(0, values.indexOf(current));
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      const target: Column = column === 'hour' ? 'minute' : 'hour';
      if ((key === 'ArrowRight') === (column === 'hour')) this.focusOption(target);
      return;
    }
    const next =
      key === 'Home'
        ? 0
        : key === 'End'
          ? values.length - 1
          : Math.min(values.length - 1, Math.max(0, index + (key === 'ArrowDown' ? 1 : -1)));
    const value = values[next] ?? current;
    if (column === 'hour') this.activeHour.set(value);
    else this.activeMinute.set(value);
    this.focusOption(column, value);
  }

  private part(group: 1 | 2): number | null {
    const match = TIME.exec(this.value() ?? '');
    return match ? Number(match[group]) : null;
  }

  private apply(hour: number, minute: number): void {
    const next = `${pad(hour)}:${pad(minute)}`;
    this.value.set(next);
    this.onChange(next);
  }

  private focusOption(column: Column, value?: number): void {
    const target = value ?? (column === 'hour' ? this.activeHour() : this.activeMinute());
    afterNextRender(
      () => {
        const id = `${this.fieldId()}-${column}-${pad(target)}`;
        const option = document.querySelector<HTMLElement>(`[data-cy="${id}"]`);
        option?.focus({ preventScroll: true });
        if (option) this.keepVisible(option);
      },
      { injector: this.ngInjector },
    );
  }

  private centerSelected(): void {
    for (const option of document.querySelectorAll<HTMLElement>(
      `[data-cy^="${this.fieldId()}-hour-"].is-selected, [data-cy^="${this.fieldId()}-minute-"].is-selected`,
    )) {
      const column = option.parentElement;
      if (column)
        column.scrollTop = option.offsetTop - column.clientHeight / 2 + option.offsetHeight / 2;
    }
  }

  private keepVisible(option: HTMLElement): void {
    const column = option.parentElement;
    if (!column) return;
    if (option.offsetTop < column.scrollTop) column.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > column.scrollTop + column.clientHeight)
      column.scrollTop = option.offsetTop + option.offsetHeight - column.clientHeight;
  }
}

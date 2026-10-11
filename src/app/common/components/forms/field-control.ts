import {
  AfterContentInit,
  computed,
  Directive,
  inject,
  Injector,
  input,
  Signal,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, ControlValueAccessor, NgControl, ValidationErrors } from '@angular/forms';
import { map, of, startWith, switchMap } from 'rxjs';

export interface ControlSnapshot {
  readonly touched: boolean;
  readonly errors: ValidationErrors | null;
}

const UNTOUCHED: ControlSnapshot = { touched: false, errors: null };

function snapshot(control: AbstractControl): ControlSnapshot {
  return { touched: control.touched, errors: control.errors };
}

export function watchControl(control: Signal<AbstractControl | null>): Signal<ControlSnapshot> {
  return toSignal(
    toObservable(control).pipe(
      switchMap((current) =>
        current
          ? current.events.pipe(
              startWith(null),
              map(() => snapshot(current)),
            )
          : of(UNTOUCHED),
      ),
    ),
    { initialValue: UNTOUCHED },
  );
}

export function isErrorVisible(state: ControlSnapshot): boolean {
  return state.touched && state.errors !== null;
}

let nextId = 0;

@Directive()
export abstract class FieldControl<T> implements ControlValueAccessor, AfterContentInit {
  private readonly injector = inject(Injector);

  readonly label = input.required<string>();
  readonly fieldId = input.required<string>();
  readonly hint = input<string>();

  private readonly uid = ++nextId;
  protected readonly controlId = computed(() => `${this.fieldId()}-${this.uid}`);
  protected readonly labelId = computed(() => `${this.controlId()}-label`);
  protected readonly hintId = computed(() => `${this.controlId()}-hint`);
  protected readonly errorId = computed(() => `${this.controlId()}-error`);

  protected readonly control = signal<AbstractControl | null>(null);
  protected readonly state = watchControl(this.control);
  protected readonly showError = computed(() => isErrorVisible(this.state()));
  protected readonly describedBy = computed(() => {
    const ids = [this.hint() ? this.hintId() : null, this.showError() ? this.errorId() : null];
    return ids.filter((id) => id !== null).join(' ') || null;
  });

  protected readonly disabled = signal(false);
  protected onChange: (value: T) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  ngAfterContentInit(): void {
    const ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
    this.control.set(ngControl?.control ?? null);
  }

  abstract writeValue(value: T): void;

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}

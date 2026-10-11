import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { startWith } from 'rxjs';

export function valueSignal<T>(control: FormControl<T>): Signal<T> {
  return toSignal(control.valueChanges.pipe(startWith(control.value)), {
    initialValue: control.value,
  });
}

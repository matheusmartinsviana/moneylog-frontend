import { Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { map } from 'rxjs';

export function dirtySignal(form: AbstractControl): Signal<boolean> {
  return toSignal(form.events.pipe(map(() => form.dirty)), { initialValue: false });
}

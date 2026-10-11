import type { AbstractControl, ValidationErrors } from '@angular/forms';

export function requiredTrimmed(control: AbstractControl<string | null>): ValidationErrors | null {
  return (control.value ?? '').trim() === '' ? { required: true } : null;
}

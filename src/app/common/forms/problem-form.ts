import { AbstractControl, FormGroup } from '@angular/forms';

import type { Problem } from '~/util/api/problem';

export function applyProblemToForm(
  form: FormGroup,
  problem: Problem,
  codeToField: Readonly<Record<string, string>> = {},
): boolean {
  let applied = false;
  const mark = (control: AbstractControl | null, code: string) => {
    if (!control) return;
    control.setErrors({ server: code });
    control.markAsTouched();
    applied = true;
  };
  for (const fieldError of problem.fieldErrors) {
    const path = fieldError.field.split('.')[0] ?? '';
    mark(form.get(path), fieldError.code);
  }
  const field = codeToField[problem.code];
  if (field) mark(form.get(field), problem.code);
  return applied;
}

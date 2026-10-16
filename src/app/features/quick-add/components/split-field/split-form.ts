import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
} from '@angular/forms';

import {
  type SplitDraft,
  type SplitMode,
  type SplitProblem,
  type SplitRow,
  splitProblem,
} from '~/util/split';

export type SplitRowGroup = FormGroup<{
  personId: FormControl<string | null>;
  percent: FormControl<string | null>;
  amount: FormControl<string | null>;
}>;

export type SplitGroup = FormGroup<{
  mode: FormControl<SplitMode>;
  includeOwner: FormControl<boolean>;
  owner: SplitRowGroup;
  others: FormArray<SplitRowGroup>;
}>;

export function newSplitRow(): SplitRowGroup {
  return new FormGroup({
    personId: new FormControl<string | null>(null),
    percent: new FormControl<string | null>(null),
    amount: new FormControl<string | null>(null),
  });
}

function rowOf(group: SplitRowGroup): SplitRow {
  const value = group.getRawValue();
  return { personId: value.personId, percent: value.percent, amount: value.amount };
}

export function draftOf(group: SplitGroup): SplitDraft {
  const value = group.getRawValue();
  return {
    mode: value.mode,
    includeOwner: value.includeOwner,
    owner: rowOf(group.controls.owner),
    others: group.controls.others.controls.map(rowOf),
  };
}

export function splitValidator(control: AbstractControl): ValidationErrors | null {
  const problem = splitProblem(draftOf(control as SplitGroup));
  return problem === null ? null : { split: problem };
}

export function problemOfSplit(group: SplitGroup): SplitProblem | null {
  const error = group.errors?.['split'];
  return typeof error === 'string' ? (error as SplitProblem) : null;
}

export function newSplitGroup(): SplitGroup {
  const group: SplitGroup = new FormGroup(
    {
      mode: new FormControl<SplitMode>('BPS', { nonNullable: true }),
      includeOwner: new FormControl(true, { nonNullable: true }),
      owner: newSplitRow(),
      others: new FormArray<SplitRowGroup>([]),
    },
    { validators: [splitValidator] },
  );
  group.disable({ emitEvent: false });
  return group;
}

export function startSplit(group: SplitGroup): void {
  group.enable({ emitEvent: false });
  if (group.controls.others.length === 0) group.controls.others.push(newSplitRow());
  group.updateValueAndValidity();
}

export function stopSplit(group: SplitGroup): void {
  group.controls.others.clear({ emitEvent: false });
  group.reset(
    {
      mode: 'BPS',
      includeOwner: true,
      owner: { personId: null, percent: null, amount: null },
    },
    { emitEvent: false },
  );
  group.disable({ emitEvent: false });
}

export function patchSplit(group: SplitGroup, draft: SplitDraft): void {
  group.enable({ emitEvent: false });
  group.controls.others.clear({ emitEvent: false });
  for (const row of draft.others) {
    const next = newSplitRow();
    next.setValue(
      { personId: row.personId, percent: row.percent, amount: row.amount },
      { emitEvent: false },
    );
    group.controls.others.push(next, { emitEvent: false });
  }
  group.controls.owner.setValue(
    { personId: null, percent: draft.owner.percent, amount: draft.owner.amount },
    { emitEvent: false },
  );
  group.controls.mode.setValue(draft.mode, { emitEvent: false });
  group.controls.includeOwner.setValue(draft.includeOwner, { emitEvent: false });
  group.updateValueAndValidity();
}

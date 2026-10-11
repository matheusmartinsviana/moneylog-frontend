import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { map, merge, Observable, of, switchMap } from 'rxjs';

import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { PersonFieldComponent } from '~/app/features/people/components/person-field/person-field.component';
import type { PersonRef } from '~/util/debt';

export type ShareGroup = FormGroup<{
  personId: FormControl<string | null>;
  amount: FormControl<string | null>;
}>;

export function newShareGroup(): ShareGroup {
  return new FormGroup({
    personId: new FormControl<string | null>(null),
    amount: new FormControl<string | null>(null),
  });
}

export const MAX_SHARES = 20;

@Component({
  selector: 'app-shares-field',
  imports: [ReactiveFormsModule, MoneyInputComponent, PersonFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shares-field.component.html',
  styleUrl: './shares-field.component.css',
})
export class SharesFieldComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly t = inject(I18nService).t;
  protected readonly MAX_SHARES = MAX_SHARES;

  readonly array = input.required<FormArray<ShareGroup>>();
  readonly people = input.required<readonly PersonRef[]>();
  readonly createPerson = input<((name: string) => Observable<PersonRef>) | null>(null);
  readonly currency = input('BRL');

  private readonly snapshot = toSignal(
    toObservable(this.array).pipe(
      switchMap((array) =>
        merge(of(null), array.valueChanges, array.statusChanges).pipe(map(() => ({ array }))),
      ),
    ),
  );
  protected readonly rows = computed(() => [...(this.snapshot()?.array.controls ?? [])]);
  protected readonly serverMessage = computed(() => {
    const error = this.snapshot()?.array.errors?.['server'];
    if (typeof error !== 'string') return null;
    return this.t().errors.codes[error] ?? this.t().form.errors.invalid;
  });

  protected nameOf(group: ShareGroup): string | null {
    const id = group.controls.personId.value;
    return this.people().find((person) => person.id === id)?.name ?? null;
  }

  protected removeLabel(group: ShareGroup, index: number): string {
    const name = this.nameOf(group);
    return name
      ? interpolate(this.t().lending.shares.remove, { name })
      : interpolate(this.t().lending.shares.removeUnnamed, { number: String(index + 1) });
  }

  protected rowLabel(index: number): string {
    return interpolate(this.t().lending.shares.row, { number: String(index + 1) });
  }

  protected add(): void {
    const array = this.array();
    if (array.length >= MAX_SHARES) return;
    array.push(newShareGroup());
    queueMicrotask(() =>
      this.host.nativeElement
        .querySelector<HTMLElement>(`[data-cy="entry-share-person-${array.length - 1}"]`)
        ?.focus(),
    );
  }

  protected remove(index: number): void {
    this.array().removeAt(index);
    queueMicrotask(() =>
      this.host.nativeElement.querySelector<HTMLElement>('[data-cy="entry-share-add"]')?.focus(),
    );
  }
}

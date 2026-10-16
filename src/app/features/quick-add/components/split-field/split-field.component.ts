import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { map, merge, Observable, of, switchMap } from 'rxjs';

import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { SegmentedControlComponent } from '~/app/common/components/forms/segmented-control/segmented-control.component';
import { SwitchComponent } from '~/app/common/components/forms/switch/switch.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { PersonFieldComponent } from '~/app/features/people/components/person-field/person-field.component';
import {
  newSplitRow,
  problemOfSplit,
  type SplitGroup,
  type SplitRowGroup,
} from '~/app/features/quick-add/components/split-field/split-form';
import type { PersonRef } from '~/util/debt';
import { MAX_SPLIT_PEOPLE, SPLIT_MODES } from '~/util/split';

export type PeopleStatus = 'idle' | 'loading' | 'error' | 'ready';

@Component({
  selector: 'app-split-field',
  imports: [
    ReactiveFormsModule,
    MoneyInputComponent,
    PersonFieldComponent,
    SegmentedControlComponent,
    SwitchComponent,
    TextFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './split-field.component.html',
  styleUrl: './split-field.component.css',
})
export class SplitFieldComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly t = inject(I18nService).t;
  protected readonly MAX = MAX_SPLIT_PEOPLE;

  readonly group = input.required<SplitGroup>();
  readonly people = input.required<readonly PersonRef[]>();
  readonly createPerson = input<((name: string) => Observable<PersonRef>) | null>(null);
  readonly currency = input('BRL');
  readonly peopleStatus = input<PeopleStatus>('ready');
  readonly idPrefix = input('split');

  readonly peopleRetry = output<void>();

  private readonly snapshot = toSignal(
    toObservable(this.group).pipe(
      switchMap((group) =>
        merge(of(null), group.valueChanges, group.statusChanges).pipe(map(() => ({ group }))),
      ),
    ),
  );

  protected readonly rows = computed(() => [
    ...(this.snapshot()?.group.controls.others.controls ?? []),
  ]);
  protected readonly mode = computed(() => this.snapshot()?.group.controls.mode.value ?? 'BPS');
  protected readonly includeOwnerVisible = computed(() => this.mode() === 'EQUAL');
  protected readonly ownerVisible = computed(
    () => this.mode() !== 'EQUAL' || (this.snapshot()?.group.controls.includeOwner.value ?? true),
  );
  protected readonly modeOptions = computed<readonly ChoiceOption[]>(() =>
    SPLIT_MODES.map((mode) => ({ value: mode, label: this.t().split.modes[mode] })),
  );
  protected readonly problemText = computed(() => {
    const group = this.snapshot()?.group;
    const problem = group ? problemOfSplit(group) : null;
    return problem === null ? null : this.t().split.problems[problem];
  });

  protected nameOf(row: SplitRowGroup): string | null {
    const id = row.controls.personId.value;
    return this.people().find((person) => person.id === id)?.name ?? null;
  }

  protected rowLabel(index: number): string {
    return interpolate(this.t().split.row, { number: String(index + 1) });
  }

  protected removeLabel(row: SplitRowGroup, index: number): string {
    const name = this.nameOf(row);
    return name
      ? interpolate(this.t().split.remove, { name })
      : interpolate(this.t().split.removeUnnamed, { number: String(index + 1) });
  }

  protected add(): void {
    const others = this.group().controls.others;
    if (others.length >= MAX_SPLIT_PEOPLE) return;
    others.push(newSplitRow());
    const index = others.length - 1;
    queueMicrotask(() =>
      this.host.nativeElement
        .querySelector<HTMLElement>(`[data-cy="${this.idPrefix()}-person-${index}"]`)
        ?.focus(),
    );
  }

  protected remove(index: number): void {
    this.group().controls.others.removeAt(index);
    queueMicrotask(() =>
      this.host.nativeElement
        .querySelector<HTMLElement>(`[data-cy="${this.idPrefix()}-add"]`)
        ?.focus(),
    );
  }
}

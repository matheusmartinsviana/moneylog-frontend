import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { map, Observable, startWith, tap } from 'rxjs';

import { EmptyStateComponent } from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { FormModalComponent } from '~/app/common/components/form-modal/form-modal.component';
import {
  FormSkeletonComponent,
  type FormSkeletonPiece,
} from '~/app/common/components/form-skeleton/form-skeleton.component';
import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { DatePickerComponent } from '~/app/common/components/forms/date-picker/date-picker.component';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { NumberStepperComponent } from '~/app/common/components/forms/number-stepper/number-stepper.component';
import { SegmentedControlComponent } from '~/app/common/components/forms/segmented-control/segmented-control.component';
import { SelectComponent } from '~/app/common/components/forms/select/select.component';
import { SwitchComponent } from '~/app/common/components/forms/switch/switch.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { valueSignal } from '~/app/common/forms/control-signal';
import { dirtySignal } from '~/app/common/forms/dirty-signal';
import { applyProblemToForm } from '~/app/common/forms/problem-form';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { EntityChanges } from '~/app/common/services/entity-changes';
import { ToastService } from '~/app/common/services/toast.service';
import {
  type PeopleStatus,
  SplitFieldComponent,
} from '~/app/features/quick-add/components/split-field/split-field.component';
import {
  draftOf,
  newSplitGroup,
  patchSplit,
  startSplit,
  stopSplit,
} from '~/app/features/quick-add/components/split-field/split-form';
import { FormOptions, loadFormOptions } from '~/app/features/quick-add/form-options';
import { AccountsListFacade } from '~/modules/accounts/core/facades/accounts-list.facade';
import { CardsListFacade } from '~/modules/cards/core/facades/cards-list.facade';
import { CategoriesFacade } from '~/modules/categories/core/facades/categories.facade';
import { PeopleListFacade } from '~/modules/people/core/facades/people-list.facade';
import { RecurrenceFormFacade } from '~/modules/recurrences/core/facades/recurrence-form.facade';
import {
  FREQUENCIES,
  Frequency,
  INTERVAL_UNITS,
  IntervalUnit,
  RECURRENCE_CURRENCY,
  RECURRENCE_TYPES,
  RecurrenceInput,
  RecurrenceMethod,
  RecurrenceType,
} from '~/modules/recurrences/core/types/recurrence';
import { Problem, problemOf } from '~/util/api/problem';
import { todayIso } from '~/util/date';
import type { PersonRef } from '~/util/debt';
import { draftFromLines, toSplitInput } from '~/util/split';

type EndMode = 'none' | 'date' | 'max';

const CODE_TO_FIELD: Readonly<Record<string, string>> = {
  TRANSACTION_AMOUNT_NOT_POSITIVE: 'amount',
  AMOUNT_ABOVE_LIMIT: 'amount',
  CATEGORY_NOT_FOUND: 'categoryId',
  CATEGORY_KIND_MISMATCH: 'categoryId',
  CATEGORY_ARCHIVED: 'categoryId',
  ACCOUNT_NOT_FOUND: 'accountId',
  ACCOUNT_ARCHIVED: 'accountId',
  TRANSACTION_ACCOUNT_NOT_CASH: 'accountId',
  TRANSACTION_PAYMENT_METHOD_REQUIRED: 'method',
  CARD_NOT_FOUND: 'cardId',
  CARD_ARCHIVED: 'cardId',
  RECURRENCE_ENDED: 'endDate',
};

const PAYMENT_METHODS: readonly RecurrenceMethod[] = [
  'CASH',
  'DEBIT',
  'PIX',
  'TRANSFER',
  'BOLETO',
  'OTHER',
];

@Component({
  selector: 'app-recurrence-form-page',
  imports: [
    FormSkeletonComponent,
    ReactiveFormsModule,
    FormModalComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    TextFieldComponent,
    MoneyInputComponent,
    SelectComponent,
    SwitchComponent,
    DatePickerComponent,
    NumberStepperComponent,
    SegmentedControlComponent,
    SplitFieldComponent,
  ],
  providers: [RecurrenceFormFacade, AccountsListFacade, CardsListFacade, PeopleListFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recurrence-form.page.html',
  styleUrl: './recurrence-form.page.css',
})
export class RecurrenceFormPage {
  protected readonly skeleton: readonly FormSkeletonPiece[] = [
    'note-2',
    'field-segmented',
    'field',
    'field-hint',
    'field',
    'field-hint-2',
    'field',
    'field',
    'switch',
    'field-date',
    'field-date',
  ];

  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly changes = inject(EntityChanges);
  private readonly toast = inject(ToastService);
  private readonly accountsFacade = inject(AccountsListFacade);
  private readonly cardsFacade = inject(CardsListFacade);
  private readonly categoriesFacade = inject(CategoriesFacade);
  private readonly peopleFacade = inject(PeopleListFacade);
  protected readonly t = inject(I18nService).t;
  protected readonly facade = inject(RecurrenceFormFacade);
  protected readonly currency = RECURRENCE_CURRENCY;

  readonly id = input<string>();

  protected readonly editing = computed(() => this.id() !== undefined);
  protected readonly recurrence = this.facade.recurrence;

  protected readonly form = new FormGroup({
    type: new FormControl<string | null>('EXPENSE'),
    amount: new FormControl<string | null>(null),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(200)],
    }),
    categoryId: new FormControl<string | null>(null),
    accountId: new FormControl<string | null>(null),
    method: new FormControl<string | null>(null),
    cardId: new FormControl<string | null>(null),
    frequency: new FormControl<string | null>('MONTHLY'),
    interval: new FormControl<number | null>(1),
    unit: new FormControl<string | null>('MONTHS'),
    startDate: new FormControl<string | null>(todayIso()),
    endMode: new FormControl<string | null>('none'),
    endDate: new FormControl<string | null>(null),
    maxOccurrences: new FormControl<number | null>(null),
    nextMonthIncome: new FormControl(false, { nonNullable: true }),
    splitOn: new FormControl(false, { nonNullable: true }),
    split: newSplitGroup(),
  });

  protected readonly dirty = dirtySignal(this.form);

  private readonly typeValue = valueSignal(this.form.controls.type);
  private readonly frequencyValue = valueSignal(this.form.controls.frequency);
  private readonly endModeValue = valueSignal(this.form.controls.endMode);
  private readonly accountValue = valueSignal(this.form.controls.accountId);
  protected readonly hasAccount = computed(() => this.accountValue() !== null);
  protected readonly isIncome = computed(() => this.typeValue() === 'INCOME');
  protected readonly isCard = computed(() => this.typeValue() === 'CARD_PURCHASE');
  private readonly splitOnValue = valueSignal(this.form.controls.splitOn);
  protected readonly splitting = computed(() => this.isCard() && this.splitOnValue());
  private readonly splitInvalid = toSignal(
    this.form.controls.split.statusChanges.pipe(
      map(() => this.form.controls.split.invalid),
      startWith(this.form.controls.split.invalid),
    ),
    { requireSync: true },
  );
  protected readonly splitBlocked = computed(() => this.splitting() && this.splitInvalid());
  protected readonly people = signal<readonly PersonRef[]>([]);
  protected readonly peopleStatus = signal<PeopleStatus>('idle');
  protected readonly isCustom = computed(() => this.frequencyValue() === 'CUSTOM');
  protected readonly endMode = computed<EndMode>(() => {
    const mode = this.endModeValue();
    return mode === 'date' || mode === 'max' ? mode : 'none';
  });

  private readonly options = signal<FormOptions | null>(null);
  private readonly optionsProblem = signal<Problem | null>(null);
  protected readonly optionsLoading = computed(
    () => this.options() === null && this.optionsProblem() === null,
  );
  protected readonly noDestination = computed(() => {
    const options = this.options();
    return (
      options !== null &&
      options.accounts.filter((account) => account.liquidity === 'CASH').length === 0 &&
      options.cards.length === 0
    );
  });

  protected readonly typeOptions = computed<readonly ChoiceOption[]>(() =>
    RECURRENCE_TYPES.map((type) => ({ value: type, label: this.t().recurrences.types[type] })),
  );
  protected readonly frequencyOptions = computed<readonly ChoiceOption[]>(() =>
    FREQUENCIES.map((frequency) => ({
      value: frequency,
      label: this.t().recurrences.frequency[frequency],
    })),
  );
  protected readonly unitOptions = computed<readonly ChoiceOption[]>(() =>
    INTERVAL_UNITS.map((unit) => ({ value: unit, label: this.t().recurrences.units[unit] })),
  );
  protected readonly endModeOptions = computed<readonly ChoiceOption[]>(() => {
    const copy = this.t().recurrences.form;
    return [
      { value: 'none', label: copy.endNone },
      { value: 'date', label: copy.endDate },
      { value: 'max', label: copy.endMax },
    ];
  });
  protected readonly methodOptions = computed<readonly ChoiceOption[]>(() =>
    PAYMENT_METHODS.map((method) => ({
      value: method,
      label: this.t().transactions.methods[method],
    })),
  );
  protected readonly categoryOptions = computed<readonly ChoiceOption[]>(() => {
    const options = this.options();
    if (!options) return [];
    const list =
      this.typeValue() === 'INCOME' ? options.incomeCategories : options.expenseCategories;
    return list.map((category) => ({ value: category.id, label: category.name }));
  });
  protected readonly accountOptions = computed<readonly ChoiceOption[]>(() =>
    (this.options()?.accounts ?? [])
      .filter((account) => account.liquidity === 'CASH')
      .map((account) => ({ value: account.id, label: account.name })),
  );
  protected readonly cardOptions = computed<readonly ChoiceOption[]>(() =>
    (this.options()?.cards ?? []).map((card) => ({ value: card.id, label: card.name })),
  );
  protected readonly intervalText = computed(
    () =>
      (count: number): string =>
        interpolate(this.t().recurrences.form.intervalValue, { count: String(count) }),
  );
  protected readonly maxText = computed(
    () =>
      (count: number): string =>
        interpolate(this.t().recurrences.form.maxValue, { count: String(count) }),
  );

  private readonly fieldHandled = signal(false);
  protected readonly banner = computed(() => {
    const problem = this.facade.problem();
    if (!problem || problem.code === 'VERSION_CONFLICT' || this.fieldHandled()) return null;
    return problemMessage(problem, this.t().errors);
  });
  protected readonly conflict = computed(() => this.facade.problem()?.code === 'VERSION_CONFLICT');
  protected readonly loadProblem = computed(() => {
    const state = this.facade.loadStatus();
    return state.status === 'error' ? state.problem : (this.optionsProblem() ?? null);
  });
  protected readonly notFound = computed(() => this.loadProblem()?.status === 404);

  constructor() {
    effect(() => {
      const card = this.isCard();
      const custom = this.isCustom();
      const mode = this.endMode();
      const editing = this.editing();
      untracked(() => {
        const c = this.form.controls;
        const toggle = (control: FormControl<unknown>, on: boolean) =>
          on ? control.enable({ emitEvent: false }) : control.disable({ emitEvent: false });
        toggle(c.accountId, !card);
        toggle(c.method, !card);
        toggle(c.cardId, card);
        toggle(c.interval, custom && !editing);
        toggle(c.unit, custom && !editing);
        toggle(c.endDate, editing || mode === 'date');
        toggle(c.maxOccurrences, !editing && mode === 'max');
        toggle(c.endMode, !editing);
        toggle(c.type, !editing);
        toggle(c.frequency, !editing);
        toggle(c.startDate, !editing);
        if (!card && c.splitOn.value) c.splitOn.setValue(false);
        toggle(c.splitOn, card);
      });
    });
    effect(() => {
      this.typeValue();
      untracked(() => {
        if (!this.editing()) this.form.controls.categoryId.setValue(null, { emitEvent: false });
      });
    });

    effect(() => {
      const id = this.id();
      if (id !== undefined) untracked(() => this.facade.load(id));
    });
    effect(() => {
      const recurrence = this.recurrence();
      if (!recurrence) return;
      untracked(() => {
        this.form.patchValue({
          type: recurrence.type,
          amount: recurrence.amount.amount,
          description: recurrence.description ?? '',
          categoryId: recurrence.category.id,
          accountId: recurrence.account?.id ?? null,
          method: recurrence.method,
          cardId: recurrence.card?.id ?? null,
          frequency: recurrence.frequency,
          interval: recurrence.interval,
          unit: recurrence.unit,
          startDate: recurrence.startDate,
          endDate: recurrence.endDate,
          maxOccurrences: recurrence.maxOccurrences,
          nextMonthIncome: recurrence.incomeCompetenceOffsetMonths === 1,
        });
        this.restoreSplit(recurrence.splitMode, recurrence.shares);
      });
    });

    this.loadOptions();

    this.form.controls.splitOn.valueChanges.pipe(takeUntilDestroyed()).subscribe((on) => {
      if (on) {
        this.ensurePeople();
        startSplit(this.form.controls.split);
      } else {
        stopSplit(this.form.controls.split);
      }
    });

    effect(() => {
      const problem = this.facade.problem();
      if (!problem) {
        this.fieldHandled.set(false);
        return;
      }
      untracked(() => this.fieldHandled.set(applyProblemToForm(this.form, problem, CODE_TO_FIELD)));
    });
    this.facade.saved$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.toast.show(
        this.editing() ? this.t().recurrences.toast.updated : this.t().recurrences.toast.created,
      );
      this.changes.notify('recurrences');
      void this.router.navigate(this.backUrl());
    });
  }

  private restoreSplit(
    mode: Parameters<typeof draftFromLines>[0] | null,
    shares: Parameters<typeof draftFromLines>[1],
  ): void {
    if (mode === null || shares.length === 0) return;
    this.ensurePeople();
    this.form.controls.splitOn.setValue(true);
    patchSplit(this.form.controls.split, draftFromLines(mode, shares));
  }

  protected readonly createPerson = (name: string): Observable<PersonRef> =>
    this.peopleFacade
      .create({ name, notes: null })
      .pipe(
        tap((person) =>
          this.people.update((list) => [...list, { id: person.id, name: person.name }]),
        ),
      );

  protected ensurePeople(): void {
    const status = this.peopleStatus();
    if (status === 'idle' || status === 'error') this.loadPeople();
  }

  protected loadPeople(): void {
    if (this.peopleStatus() === 'loading') return;
    this.peopleStatus.set('loading');
    this.peopleFacade
      .loadAll('ACTIVE')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (people) => {
          this.people.set(people.map((person) => ({ id: person.id, name: person.name })));
          this.peopleStatus.set('ready');
        },
        error: () => this.peopleStatus.set('error'),
      });
  }

  private backUrl(): string[] {
    return this.editing() ? ['/planning/recurrences'] : ['/planning/recurrences'];
  }

  protected close(): void {
    void this.router.navigate(this.backUrl());
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const card = this.isCard();
    const recurrence = this.recurrence();
    const id = this.id();

    if (id !== undefined && recurrence) {
      this.facade.save({
        kind: 'update',
        id,
        input: {
          amount: value.amount ?? '',
          description: value.description.trim(),
          categoryId: value.categoryId ?? '',
          accountId: card ? null : value.accountId,
          method:
            card || value.accountId === null ? null : (value.method as RecurrenceMethod | null),
          cardId: card ? value.cardId : null,
          endDate: value.endDate,
          ...(card ? { split: this.splitInput() } : {}),
          ...(recurrence.type === 'INCOME'
            ? { incomeCompetenceOffsetMonths: value.nextMonthIncome ? (1 as const) : (0 as const) }
            : {}),
          version: recurrence.version,
        },
      });
      return;
    }
    const mode = this.endMode();
    const input: RecurrenceInput = {
      type: (value.type ?? 'EXPENSE') as RecurrenceType,
      amount: value.amount ?? '',
      description: value.description.trim(),
      categoryId: value.categoryId ?? '',
      accountId: card ? null : value.accountId,
      method: card || value.accountId === null ? null : (value.method as RecurrenceMethod | null),
      cardId: card ? value.cardId : null,
      frequency: (value.frequency ?? 'MONTHLY') as Frequency,
      interval: this.isCustom() ? value.interval : null,
      unit: this.isCustom() ? (value.unit as IntervalUnit | null) : null,
      startDate: value.startDate ?? todayIso(),
      endDate: mode === 'date' ? value.endDate : null,
      maxOccurrences: mode === 'max' ? value.maxOccurrences : null,
      ...(value.type === 'INCOME' && value.nextMonthIncome
        ? { incomeCompetenceOffsetMonths: 1 as const }
        : {}),
      ...(card && this.splitting() ? { split: this.splitInput() } : {}),
    };
    this.facade.save({ kind: 'create', input });
  }

  private splitInput() {
    return this.splitting() ? toSplitInput(draftOf(this.form.controls.split)) : null;
  }

  protected reloadLatest(): void {
    const id = this.id();
    if (id === undefined) return;
    this.facade.dismissProblem();
    this.facade.load(id);
  }

  protected retryLoad(): void {
    if (this.optionsProblem() !== null) this.loadOptions();
    const id = this.id();
    if (id !== undefined && this.facade.loadStatus().status === 'error') this.facade.load(id);
  }

  private loadOptions(): void {
    this.optionsProblem.set(null);
    this.options.set(null);
    loadFormOptions(this.accountsFacade, this.categoriesFacade, this.cardsFacade)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => this.options.set(options),
        error: (error: unknown) => this.optionsProblem.set(problemOf(error)),
      });
  }
}

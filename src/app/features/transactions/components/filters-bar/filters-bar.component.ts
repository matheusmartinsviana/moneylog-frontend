import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { DisclosureComponent } from '~/app/common/components/disclosure/disclosure.component';
import { CheckboxComponent } from '~/app/common/components/forms/checkbox/checkbox.component';
import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { DatePickerComponent } from '~/app/common/components/forms/date-picker/date-picker.component';
import { MonthPickerComponent } from '~/app/common/components/forms/month-picker/month-picker.component';
import { SelectComponent } from '~/app/common/components/forms/select/select.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { IconComponent } from '~/app/common/components/icon/icon.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { ListFilters, SEARCH_MAX_LENGTH } from '~/modules/transactions/core/types/list-filters';
import {
  ACCOUNT_TRANSACTION_TYPES,
  PAYMENT_METHODS,
  TRANSACTION_SOURCES,
} from '~/modules/transactions/core/types/transaction-enums';
import type {
  PaymentMethod,
  TransactionType,
} from '~/modules/transactions/core/types/transaction-enums';
import { cleanSearchTerm } from '~/util/search-term';

export interface FilterOption {
  readonly id: string;
  readonly name: string;
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

@Component({
  selector: 'app-filters-bar',
  imports: [
    ReactiveFormsModule,
    CheckboxComponent,
    DatePickerComponent,
    DisclosureComponent,
    IconComponent,
    MonthPickerComponent,
    SelectComponent,
    TextFieldComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filters-bar.component.html',
  styleUrl: './filters-bar.component.css',
})
export class FiltersBarComponent {
  protected readonly t = inject(I18nService).t;

  readonly filters = input.required<ListFilters>();
  readonly accounts = input<readonly FilterOption[]>([]);
  readonly categories = input<readonly FilterOption[]>([]);
  readonly patch = output<Partial<ListFilters>>();
  readonly searchChange = output<string>();
  readonly clear = output<void>();

  protected readonly searchMax = SEARCH_MAX_LENGTH;
  protected readonly open = signal(false);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  protected reveal(fieldId: string): void {
    this.open.set(true);
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelector<HTMLElement>(`[data-cy="${fieldId}"], #${fieldId}`)
          ?.focus(),
      { injector: this.injector },
    );
  }

  protected readonly form = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    from: new FormControl<string | null>(null),
    to: new FormControl<string | null>(null),
    type: new FormControl<string | null>(null),
    accountId: new FormControl<string | null>(null),
    categoryId: new FormControl<string | null>(null),
    method: new FormControl<string | null>(null),
    source: new FormControl<string | null>(null),
    competence: new FormControl<string | null>(null),
    lens: new FormControl<string | null>('CONSUMPTION'),
    voided: new FormControl(false, { nonNullable: true }),
  });

  protected readonly typeOptions = computed<readonly ChoiceOption[]>(() =>
    ACCOUNT_TRANSACTION_TYPES.map((type) => ({
      value: type,
      label: this.t().transactions.types[type],
    })),
  );
  protected readonly methodOptions = computed<readonly ChoiceOption[]>(() =>
    PAYMENT_METHODS.map((method) => ({
      value: method,
      label: this.t().transactions.methods[method],
    })),
  );
  protected readonly sourceOptions = computed<readonly ChoiceOption[]>(() =>
    TRANSACTION_SOURCES.map((source) => ({
      value: source,
      label: this.t().transactions.sources[source],
    })),
  );
  protected readonly lensOptions = computed<readonly ChoiceOption[]>(() => [
    { value: 'CONSUMPTION', label: this.t().transactions.filters.lensConsumption },
    { value: 'INCOME', label: this.t().transactions.filters.lensIncome },
  ]);
  protected readonly accountOptions = computed<readonly ChoiceOption[]>(() =>
    this.accounts().map((account) => ({ value: account.id, label: account.name })),
  );
  protected readonly categoryOptions = computed<readonly ChoiceOption[]>(() =>
    this.categories().map((category) => ({ value: category.id, label: category.name })),
  );

  private lastEmitted = '';
  private readonly applied = new Map<string, unknown>();

  constructor() {
    effect(() => {
      const f = this.filters();
      untracked(() => {
        if (f.q !== this.lastEmitted) {
          this.lastEmitted = f.q;
          this.form.controls.search.setValue(f.q, { emitEvent: false });
        }
        this.sync('from', f.from, this.form.controls.from);
        this.sync('to', f.to, this.form.controls.to);
        this.sync('type', f.type, this.form.controls.type);
        this.sync('accountId', f.accountId, this.form.controls.accountId);
        this.sync('categoryId', f.categoryId, this.form.controls.categoryId);
        this.sync('method', f.method, this.form.controls.method);
        this.sync('source', f.source, this.form.controls.source);
        this.sync('competence', f.competence, this.form.controls.competence);
        this.sync('lens', f.lens, this.form.controls.lens);
        this.sync('voided', f.status === 'VOIDED', this.form.controls.voided);
      });
    });

    const { controls } = this.form;
    controls.search.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.lastEmitted = cleanSearchTerm(value);
      this.searchChange.emit(value);
    });
    for (const key of ['from', 'to'] as const) {
      controls[key].valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
        if (value && DATE.test(value)) this.patch.emit({ [key]: value });
        else if (!value && controls[key].valid) this.patch.emit({ [key]: null });
      });
    }
    controls.competence.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (value && MONTH.test(value)) this.patch.emit({ competence: value });
    });
    for (const key of ['type', 'accountId', 'categoryId', 'method', 'source'] as const) {
      controls[key].valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
        this.patch.emit({ [key]: value as TransactionType | PaymentMethod | string | null });
      });
    }
    controls.lens.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      this.patch.emit({ lens: value === 'INCOME' ? 'INCOME' : 'CONSUMPTION' });
    });
    controls.voided.valueChanges.pipe(takeUntilDestroyed()).subscribe((checked) => {
      this.patch.emit({ status: checked ? 'VOIDED' : 'ACTIVE' });
    });
  }

  private sync<T>(key: string, value: T, control: FormControl<T>): void {
    if (this.applied.has(key) && this.applied.get(key) === value) return;
    this.applied.set(key, value);
    control.setValue(value, { emitEvent: false });
  }
}

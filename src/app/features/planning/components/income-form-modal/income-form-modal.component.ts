import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { startWith } from 'rxjs';

import { FormModalComponent } from '~/app/common/components/form-modal/form-modal.component';
import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { DatePickerComponent } from '~/app/common/components/forms/date-picker/date-picker.component';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { NumberStepperComponent } from '~/app/common/components/forms/number-stepper/number-stepper.component';
import { SegmentedControlComponent } from '~/app/common/components/forms/segmented-control/segmented-control.component';
import { SelectComponent } from '~/app/common/components/forms/select/select.component';
import { SwitchComponent } from '~/app/common/components/forms/switch/switch.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { dirtySignal } from '~/app/common/forms/dirty-signal';
import { applyProblemToForm } from '~/app/common/forms/problem-form';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import { DebtsListFacade } from '~/modules/debts/core/facades/debts-list.facade';
import { IncomeProfileFormFacade } from '~/modules/income/core/facades/income-profile-form.facade';
import {
  DEDUCTION_KINDS,
  INCOME_CURRENCY,
  type DeductionKind,
  type IncomeProfile,
  type IncomeProfileInput,
  type PayrollDeductionInput,
} from '~/modules/income/core/types/income';
import { counterpartyName } from '~/util/debt-name';
import { formatMoney } from '~/util/money';
import { bpsToPercentText, percentTextToBps } from '~/util/ratio';

const CODE_TO_FIELD: Readonly<Record<string, string>> = {
  INCOME_PROFILE_INVALID: 'deductions',
};

const MODE_AMOUNT = 'AMOUNT';
const MODE_PERCENT = 'PERCENT';

function percentValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return value === '' || percentTextToBps(value) !== null ? null : { percentInvalid: true };
}

function deductionGroup() {
  return new FormGroup({
    kind: new FormControl<string | null>('OTHER', [Validators.required]),
    label: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    mode: new FormControl<string | null>(MODE_AMOUNT),
    amount: new FormControl<string | null>(null),
    percent: new FormControl<string | null>(null, [percentValidator]),
    startsOn: new FormControl<string | null>(null),
    endsOn: new FormControl<string | null>(null),
    debtId: new FormControl<string | null>(null),
    interestAmount: new FormControl<string | null>(null),
  });
}

type DeductionGroup = ReturnType<typeof deductionGroup>;

@Component({
  selector: 'app-income-form-modal',
  imports: [
    ReactiveFormsModule,
    FormModalComponent,
    TextFieldComponent,
    MoneyInputComponent,
    NumberStepperComponent,
    SwitchComponent,
    SelectComponent,
    SegmentedControlComponent,
    DatePickerComponent,
  ],
  providers: [IncomeProfileFormFacade, DebtsListFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-form-modal
      #modal
      [heading]="editing() ? t().income.form.editTitle : t().income.form.title"
      [dirty]="dirty()"
      [busy]="facade.saving()"
      (closed)="closed.emit()"
    >
      <form
        class="form"
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        novalidate
        data-cy="income-form"
      >
        @if (banner(); as message) {
          <p class="banner" role="alert" data-cy="income-form-error">{{ message }}</p>
        }
        <app-text-field
          formControlName="source"
          fieldId="income-form-source"
          autocomplete="off"
          [maxlength]="100"
          [label]="t().income.form.source"
        />
        <app-money-input
          formControlName="gross"
          fieldId="income-form-gross"
          [currency]="currency"
          [label]="t().income.form.gross"
        />
        <app-number-stepper
          formControlName="dependents"
          fieldId="income-form-dependents"
          [min]="0"
          [max]="20"
          [label]="t().income.form.dependents"
        />

        <app-switch
          formControlName="advanceEnabled"
          fieldId="income-form-advance-enabled"
          [label]="t().income.form.advanceEnabled"
        />
        @if (advanceEnabled()) {
          <div class="pair">
            <app-number-stepper
              formControlName="advanceDay"
              fieldId="income-form-advance-day"
              [min]="1"
              [max]="28"
              [label]="t().income.form.advanceDay"
            />
            <app-text-field
              formControlName="advancePercent"
              fieldId="income-form-advance-percent"
              inputmode="decimal"
              autocomplete="off"
              [maxlength]="6"
              [label]="t().income.form.advancePercent"
              [hint]="t().income.form.advancePercentHint"
            />
          </div>
        }
        <app-number-stepper
          formControlName="balanceDay"
          fieldId="income-form-balance-day"
          [min]="1"
          [max]="28"
          [label]="t().income.form.balanceDay"
          [hint]="t().income.form.balanceDayHint"
        />

        <app-switch
          formControlName="thirteenthEnabled"
          fieldId="income-form-thirteenth-enabled"
          [label]="t().income.form.thirteenthEnabled"
        />
        @if (thirteenthEnabled()) {
          <app-number-stepper
            formControlName="thirteenthMonth"
            fieldId="income-form-thirteenth-month"
            [min]="1"
            [max]="12"
            [label]="t().income.form.thirteenthMonth"
          />
        }

        <fieldset class="deductions" data-cy="income-form-deductions">
          <legend class="deductions__title">{{ t().income.form.deductions }}</legend>
          @for (deduction of deductions.controls; track deduction; let i = $index) {
            <div
              class="deduction"
              [formGroup]="deduction"
              [attr.data-cy]="'income-form-deduction-' + i"
            >
              <p class="deduction__title">{{ deductionTitle(i) }}</p>
              <div class="pair">
                <app-select
                  formControlName="kind"
                  [fieldId]="'income-form-deduction-kind-' + i"
                  [options]="kindOptions()"
                  [label]="t().income.form.deductionKind"
                />
                <app-text-field
                  formControlName="label"
                  [fieldId]="'income-form-deduction-label-' + i"
                  autocomplete="off"
                  [maxlength]="100"
                  [label]="t().income.form.deductionLabel"
                />
              </div>
              <app-segmented-control
                formControlName="mode"
                [fieldId]="'income-form-deduction-mode-' + i"
                [options]="modeOptions()"
                [label]="t().income.form.deductionMode"
              />
              @if (deduction.controls.mode.value === modePercent) {
                <app-text-field
                  formControlName="percent"
                  [fieldId]="'income-form-deduction-percent-' + i"
                  inputmode="decimal"
                  autocomplete="off"
                  [maxlength]="6"
                  [label]="t().income.form.deductionPercent"
                  [hint]="t().income.form.deductionPercentHint"
                />
              } @else {
                <app-money-input
                  formControlName="amount"
                  [fieldId]="'income-form-deduction-amount-' + i"
                  [currency]="currency"
                  [label]="t().income.form.deductionAmount"
                />
              }
              <div class="pair">
                <app-date-picker
                  formControlName="startsOn"
                  [fieldId]="'income-form-deduction-starts-' + i"
                  [mandatory]="false"
                  [label]="t().income.form.startsOn"
                />
                <app-date-picker
                  formControlName="endsOn"
                  [fieldId]="'income-form-deduction-ends-' + i"
                  [mandatory]="false"
                  [label]="t().income.form.endsOn"
                />
              </div>
              @if (deduction.controls.kind.value === 'LOAN') {
                @if (debtOptions().length === 0) {
                  <p class="hint" [attr.data-cy]="'income-form-deduction-no-debts-' + i">
                    {{ t().income.form.noDebts }}
                  </p>
                } @else {
                  <app-select
                    formControlName="debtId"
                    [fieldId]="'income-form-deduction-debt-' + i"
                    [options]="debtOptions()"
                    [mandatory]="false"
                    [emptyLabel]="t().income.form.noDebts"
                    [label]="t().income.form.debt"
                    [hint]="t().income.form.debtHint"
                  />
                }
                <app-money-input
                  formControlName="interestAmount"
                  [fieldId]="'income-form-deduction-interest-' + i"
                  [currency]="currency"
                  [mandatory]="false"
                  [allowZero]="true"
                  [label]="t().income.form.interest"
                  [hint]="t().income.form.interestHint"
                />
              }
              <button
                type="button"
                class="button"
                [attr.data-cy]="'income-form-remove-deduction-' + i"
                (click)="removeDeduction(i)"
              >
                {{ removeLabel(i) }}
              </button>
            </div>
          }
          <button
            type="button"
            class="button"
            data-cy="income-form-add-deduction"
            (click)="addDeduction()"
          >
            {{ t().income.form.addDeduction }}
          </button>
        </fieldset>

        <div class="actions">
          <button
            type="button"
            class="button"
            data-cy="income-form-cancel"
            (click)="modal.requestClose()"
          >
            {{ t().income.form.cancel }}
          </button>
          <button
            type="submit"
            class="button button--primary"
            data-cy="income-form-save"
            [disabled]="facade.saving()"
            [attr.aria-busy]="facade.saving()"
          >
            {{ facade.saving() ? t().income.form.saving : t().income.form.save }}
          </button>
        </div>
      </form>
    </app-form-modal>
  `,
  styles: `
    :host {
      display: contents;
    }

    .form {
      display: grid;
      gap: var(--space-4);
    }

    .hint {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .pair {
      display: grid;
      gap: var(--space-4);
    }

    .deductions {
      display: grid;
      gap: var(--space-4);
      min-width: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }

    .deductions__title {
      padding: 0;
      font-weight: var(--weight-semibold);
    }

    .deduction {
      display: grid;
      gap: var(--space-4);
      padding: var(--space-4);
      border: var(--border-width) solid var(--color-border);
      border-radius: var(--radius-control);
    }

    .deduction__title {
      margin: 0;
      font-weight: var(--weight-medium);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-2);
    }

    @media (width >= 480px) {
      .pair {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `,
})
export class IncomeFormModalComponent {
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  private readonly debts = inject(DebtsListFacade);
  protected readonly t = this.i18n.t;
  protected readonly facade = inject(IncomeProfileFormFacade);
  protected readonly currency = INCOME_CURRENCY;
  protected readonly modePercent = MODE_PERCENT;

  readonly profile = input<IncomeProfile | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly editing = computed(() => this.profile() !== null);
  protected readonly deductions = new FormArray<DeductionGroup>([]);
  protected readonly form = new FormGroup({
    source: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    gross: new FormControl<string | null>(null),
    dependents: new FormControl<number | null>(0, [Validators.required]),
    advanceEnabled: new FormControl(false, { nonNullable: true }),
    advanceDay: new FormControl<number | null>(16),
    advancePercent: new FormControl<string | null>(null, [percentValidator]),
    balanceDay: new FormControl<number | null>(1, [Validators.required]),
    thirteenthEnabled: new FormControl(false, { nonNullable: true }),
    thirteenthMonth: new FormControl<number | null>(11),
    deductions: this.deductions,
  });
  protected readonly dirty = dirtySignal(this.form);

  private readonly values = toSignal(this.form.valueChanges.pipe(startWith(this.form.value)), {
    initialValue: this.form.value,
  });
  protected readonly advanceEnabled = computed(() => this.values().advanceEnabled === true);
  protected readonly thirteenthEnabled = computed(() => this.values().thirteenthEnabled === true);

  protected readonly kindOptions = computed<readonly ChoiceOption[]>(() =>
    DEDUCTION_KINDS.map((kind) => ({ value: kind, label: this.t().income.deduction.kind[kind] })),
  );
  protected readonly modeOptions = computed<readonly ChoiceOption[]>(() => [
    { value: MODE_AMOUNT, label: this.t().income.form.modeAmount },
    { value: MODE_PERCENT, label: this.t().income.form.modePercent },
  ]);
  protected readonly debtOptions = computed<readonly ChoiceOption[]>(() =>
    (this.debts.data() ?? [])
      .filter((debt) => debt.status === 'OPEN' || debt.status === 'PARTIALLY_SETTLED')
      .map((debt) => ({
        value: debt.id,
        label: [counterpartyName(debt), debt.description, formatMoney(debt.outstanding)]
          .filter((part) => part !== null && part !== '')
          .join(' · '),
      })),
  );

  private readonly fieldHandled = signal(false);
  protected readonly banner = computed(() => {
    const problem = this.facade.problem();
    if (!problem || this.fieldHandled()) return null;
    return problemMessage(problem, this.t().errors);
  });

  constructor() {
    this.debts.load({ direction: 'PAYABLE' });
    effect(() => {
      const profile = this.profile();
      untracked(() => {
        if (profile !== null) this.fill(profile);
      });
    });
    effect(() => {
      const problem = this.facade.problem();
      untracked(() =>
        this.fieldHandled.set(
          problem ? applyProblemToForm(this.form, problem, CODE_TO_FIELD) : false,
        ),
      );
    });
    this.facade.saved$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.toast.show(
        this.editing() ? this.t().income.form.toastUpdated : this.t().income.form.toast,
      );
      this.saved.emit();
    });
  }

  protected addDeduction(): void {
    this.deductions.push(deductionGroup());
  }

  protected removeDeduction(index: number): void {
    this.deductions.removeAt(index);
    this.form.markAsDirty();
  }

  protected deductionTitle(index: number): string {
    return interpolate(this.t().income.form.deductionTitle, { number: String(index + 1) });
  }

  protected removeLabel(index: number): string {
    return interpolate(this.t().income.form.removeDeduction, { number: String(index + 1) });
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    const input = this.toInput();
    if (this.form.invalid || input === null) return;
    const profile = this.profile();
    if (profile === null) this.facade.create(input);
    else this.facade.update(profile.id, { ...input, version: profile.version });
  }

  private fill(profile: IncomeProfile): void {
    this.deductions.clear();
    for (const deduction of profile.deductions) {
      const group = deductionGroup();
      group.patchValue({
        kind: deduction.kind,
        label: deduction.label,
        mode: deduction.percentBps !== null ? MODE_PERCENT : MODE_AMOUNT,
        amount: deduction.amount?.amount ?? null,
        percent: deduction.percentBps !== null ? bpsToPercentText(deduction.percentBps) : null,
        startsOn: deduction.startsOn,
        endsOn: deduction.endsOn,
        debtId: deduction.debtId,
        interestAmount: deduction.interestAmount?.amount ?? null,
      });
      this.deductions.push(group);
    }
    this.form.patchValue({
      source: profile.source,
      gross: profile.gross.amount,
      dependents: profile.dependents,
      advanceEnabled: profile.advance !== null,
      advanceDay: profile.advance?.dayOfMonth ?? 16,
      advancePercent:
        profile.advance !== null ? bpsToPercentText(profile.advance.percentBps) : null,
      balanceDay: profile.balanceDayOfMonth,
      thirteenthEnabled: profile.thirteenth.enabled,
      thirteenthMonth: profile.thirteenth.firstInstallmentMonth,
    });
    this.form.markAsPristine();
  }

  private toInput(): IncomeProfileInput | null {
    const value = this.form.getRawValue();
    const source = value.source.trim();
    const gross = value.gross ?? '';
    if (source === '' || gross === '' || value.dependents === null || value.balanceDay === null) {
      return null;
    }
    let advance: IncomeProfileInput['advance'] = null;
    if (value.advanceEnabled) {
      const bps = percentTextToBps(value.advancePercent ?? '');
      if (value.advanceDay === null || bps === null) return null;
      advance = { dayOfMonth: value.advanceDay, percentBps: bps };
    }
    const deductions: PayrollDeductionInput[] = [];
    for (const item of value.deductions) {
      const deduction = this.toDeduction(item);
      if (deduction === null) return null;
      deductions.push(deduction);
    }
    return {
      source,
      gross,
      dependents: value.dependents,
      advance,
      balanceDayOfMonth: value.balanceDay,
      deductions,
      thirteenth: {
        enabled: value.thirteenthEnabled,
        firstInstallmentMonth: value.thirteenthMonth ?? 11,
      },
    };
  }

  private toDeduction(
    item: ReturnType<DeductionGroup['getRawValue']>,
  ): PayrollDeductionInput | null {
    const label = item.label.trim();
    if (label === '' || item.kind === null) return null;
    const percent = item.mode === MODE_PERCENT;
    const amount = percent ? null : (item.amount ?? '');
    const bps = percent ? percentTextToBps(item.percent ?? '') : null;
    if ((percent && (bps === null || bps === 0)) || (!percent && amount === '')) return null;
    const loan = item.kind === 'LOAN';
    return {
      kind: item.kind as DeductionKind,
      label,
      amount,
      percentBps: bps,
      startsOn: item.startsOn,
      endsOn: item.endsOn,
      debtId: loan ? item.debtId : null,
      interestAmount:
        loan && item.interestAmount !== null && item.interestAmount !== ''
          ? item.interestAmount
          : null,
    };
  }
}

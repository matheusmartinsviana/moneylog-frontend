import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  EmptyStateAction,
  EmptyStateComponent,
} from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { MonthPickerComponent } from '~/app/common/components/forms/month-picker/month-picker.component';
import { NumberStepperComponent } from '~/app/common/components/forms/number-stepper/number-stepper.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { PageLayoutComponent } from '~/app/common/components/page-layout/page-layout.component';
import { SectionContainerComponent } from '~/app/common/components/section-container/section-container.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { SimulationResultComponent } from '~/app/features/simulator/components/simulation-result/simulation-result.component';
import {
  CutOption,
  SubscriptionCutsComponent,
} from '~/app/features/simulator/components/subscription-cuts/subscription-cuts.component';
import { SubscriptionsFacade } from '~/modules/recurrences/core/facades/subscriptions.facade';
import { PurchaseSimulationFacade } from '~/modules/simulations/core/facades/purchase-simulation.facade';
import { nextMonthOf, todayIso } from '~/util/date';
import { percentTextToBps } from '~/util/ratio';

const MAX_INSTALLMENTS = 36;
const MAX_MONTH = '2100-12';

function interestValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return value === '' || percentTextToBps(value) !== null ? null : { pattern: true };
}

@Component({
  selector: 'app-simulator-page',
  imports: [
    EmptyStateComponent,
    ErrorStateComponent,
    MoneyInputComponent,
    MonthPickerComponent,
    NumberStepperComponent,
    PageLayoutComponent,
    ReactiveFormsModule,
    SectionContainerComponent,
    SimulationResultComponent,
    SubscriptionCutsComponent,
    TextFieldComponent,
  ],
  providers: [PurchaseSimulationFacade, SubscriptionsFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './simulator.page.html',
  styleUrl: './simulator.page.css',
})
export class SimulatorPage implements OnInit {
  protected readonly t = inject(I18nService).t;
  protected readonly simulation = inject(PurchaseSimulationFacade);
  protected readonly subscriptions = inject(SubscriptionsFacade);
  protected readonly maxInstallments = MAX_INSTALLMENTS;
  protected readonly minMonth = todayIso().slice(0, 7);
  protected readonly maxMonth = MAX_MONTH;

  private readonly defaultMonth = nextMonthOf(todayIso().slice(0, 7));

  protected readonly form = new FormGroup({
    amount: new FormControl<string | null>(null, [Validators.required]),
    installments: new FormControl<number | null>(1, [
      Validators.required,
      Validators.min(1),
      Validators.max(MAX_INSTALLMENTS),
    ]),
    interest: new FormControl('', { nonNullable: true, validators: [interestValidator] }),
    firstMonth: new FormControl<string | null>(this.defaultMonth, [Validators.required]),
  });

  protected readonly selectedCuts = signal<readonly string[]>([]);

  protected readonly installmentsText = computed(
    () =>
      (count: number): string =>
        interpolate(this.t().simulator.form.installmentsValue, { count: String(count) }),
  );

  protected readonly cutOptions = computed<readonly CutOption[]>(() =>
    (this.subscriptions.overview()?.items ?? []).map((item) => ({
      id: item.recurrence.id,
      name: item.recurrence.description ?? item.recurrence.category.name,
      monthly: item.monthlyEquivalentMine,
    })),
  );

  protected readonly cutsStatus = computed(() => this.subscriptions.state().status);

  protected readonly emptyActions = computed<readonly EmptyStateAction[]>(() => [
    {
      id: 'reset',
      label: this.t().simulator.form.reset,
      available: true,
      primary: true,
    },
  ]);

  ngOnInit(): void {
    this.subscriptions.load();
  }

  protected toggleCut(event: { readonly id: string; readonly checked: boolean }): void {
    this.selectedCuts.update((ids) => {
      const without = ids.filter((id) => id !== event.id);
      return event.checked ? [...without, event.id] : without;
    });
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.simulation.loading()) return;
    const value = this.form.getRawValue();
    const interest = value.interest.trim();
    const available = new Set(this.cutOptions().map((option) => option.id));
    this.simulation.run({
      amount: value.amount ?? '',
      installments: value.installments ?? 1,
      interestRatePerMonthBps: interest === '' ? 0 : (percentTextToBps(interest) ?? 0),
      firstInstallmentMonth: value.firstMonth ?? this.defaultMonth,
      cancelSubscriptionIds: this.selectedCuts().filter((id) => available.has(id)),
    });
  }

  protected reset(): void {
    this.form.reset({
      amount: null,
      installments: 1,
      interest: '',
      firstMonth: this.defaultMonth,
    });
    this.selectedCuts.set([]);
    this.simulation.reset();
  }

  protected retryCuts(): void {
    this.subscriptions.load();
  }
}

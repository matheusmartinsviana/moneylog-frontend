import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
  untracked,
  effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { FormModalComponent } from '~/app/common/components/form-modal/form-modal.component';
import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { DatePickerComponent } from '~/app/common/components/forms/date-picker/date-picker.component';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { NumberStepperComponent } from '~/app/common/components/forms/number-stepper/number-stepper.component';
import { RadioGroupComponent } from '~/app/common/components/forms/radio-group/radio-group.component';
import { SelectComponent } from '~/app/common/components/forms/select/select.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { dirtySignal } from '~/app/common/forms/dirty-signal';
import { applyProblemToForm } from '~/app/common/forms/problem-form';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { EntityChanges } from '~/app/common/services/entity-changes';
import { ToastService } from '~/app/common/services/toast.service';
import { AccountsListFacade } from '~/modules/accounts/core/facades/accounts-list.facade';
import type { Account } from '~/modules/accounts/core/types/account';
import { CardCashOutFacade } from '~/modules/debts/core/facades/card-cash-out.facade';
import { DEBT_CURRENCY } from '~/modules/debts/core/types/debt';
import { PeopleListFacade } from '~/modules/people/core/facades/people-list.facade';
import type { Person } from '~/modules/people/core/types/person';
import type { Problem } from '~/util/api/problem';
import { todayIso } from '~/util/date';
import { percentTextToBps } from '~/util/ratio';

const CODE_TO_FIELD: Readonly<Record<string, string>> = {
  CARD_CASH_OUT_INVALID: 'principal',
  AMOUNT_ABOVE_LIMIT: 'principal',
  TRANSACTION_ACCOUNT_NOT_CASH: 'accountId',
  ACCOUNT_ARCHIVED: 'accountId',
  ACCOUNT_NOT_FOUND: 'accountId',
  PERSON_ARCHIVED: 'personId',
};

const MAX_INSTALLMENTS = 36;
type CostMode = 'TOTAL' | 'RATE';
type Destination = 'ME' | 'PERSON';
const COST_MODES: readonly CostMode[] = ['TOTAL', 'RATE'];
const DESTINATIONS: readonly Destination[] = ['ME', 'PERSON'];

function rateValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  return value === '' || percentTextToBps(value) !== null ? null : { pattern: true };
}

@Component({
  selector: 'app-card-cash-out-page',
  imports: [
    ReactiveFormsModule,
    FormModalComponent,
    MoneyInputComponent,
    NumberStepperComponent,
    RadioGroupComponent,
    SelectComponent,
    DatePickerComponent,
    TextFieldComponent,
  ],
  providers: [CardCashOutFacade, AccountsListFacade, PeopleListFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card-cash-out.page.html',
  styleUrl: './card-cash-out.page.css',
})
export class CardCashOutPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly changes = inject(EntityChanges);
  private readonly toast = inject(ToastService);
  private readonly accountsFacade = inject(AccountsListFacade);
  private readonly peopleFacade = inject(PeopleListFacade);
  protected readonly t = inject(I18nService).t;
  protected readonly facade = inject(CardCashOutFacade);
  protected readonly currency = DEBT_CURRENCY;
  protected readonly maxInstallments = MAX_INSTALLMENTS;

  readonly id = input.required<string>();

  protected readonly form = new FormGroup({
    destination: new FormControl<string | null>('ME'),
    accountId: new FormControl<string | null>(null, [Validators.required]),
    personId: new FormControl<string | null>(null),
    principal: new FormControl<string | null>(null),
    installments: new FormControl<number | null>(1),
    costMode: new FormControl<string | null>('TOTAL'),
    totalWithInterest: new FormControl<string | null>(null),
    rate: new FormControl('', { nonNullable: true, validators: [rateValidator] }),
    firstInvoiceDate: new FormControl<string | null>(todayIso()),
    channel: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(60)] }),
  });

  protected readonly dirty = dirtySignal(this.form);

  private readonly accounts = signal<readonly Account[]>([]);
  private readonly people = signal<readonly Person[]>([]);
  protected readonly loadFailed = signal(false);
  protected readonly destination = signal<Destination>('ME');
  protected readonly costMode = signal<CostMode>('TOTAL');
  private readonly fieldHandled = signal(false);

  protected readonly destinationOptions = computed<readonly ChoiceOption[]>(() =>
    DESTINATIONS.map((value) => ({ value, label: this.t().cardCashOut.destination[value] })),
  );
  protected readonly costModeOptions = computed<readonly ChoiceOption[]>(() =>
    COST_MODES.map((value) => ({ value, label: this.t().cardCashOut.costMode[value] })),
  );
  protected readonly accountOptions = computed<readonly ChoiceOption[]>(() =>
    this.accounts()
      .filter((account) => account.liquidity === 'CASH')
      .map((account) => ({ value: account.id, label: account.name })),
  );
  protected readonly personOptions = computed<readonly ChoiceOption[]>(() =>
    this.people().map((person) => ({ value: person.id, label: person.name })),
  );
  protected readonly installmentsText = computed(
    () =>
      (count: number): string =>
        interpolate(this.t().cardCashOut.installmentsValue, { count: String(count) }),
  );
  protected readonly banner = computed(() => {
    const problem = this.facade.problem();
    return problem && !this.fieldHandled() ? problemMessage(problem, this.t().errors) : null;
  });

  constructor() {
    this.loadOptions();

    this.form.controls.destination.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.changeDestination(value === 'PERSON' ? 'PERSON' : 'ME'));
    this.form.controls.costMode.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.changeCostMode(value === 'RATE' ? 'RATE' : 'TOTAL'));

    effect(() => {
      const problem = this.facade.problem();
      if (!problem) {
        this.fieldHandled.set(false);
        return;
      }
      untracked(() => this.fieldHandled.set(this.applyProblem(problem)));
    });

    this.facade.saved$.pipe(takeUntilDestroyed()).subscribe((debt) => {
      this.toast.show(this.t().cardCashOut.toast);
      this.changes.notify('cards');
      void this.router.navigate(['/debts', debt.id]);
    });
  }

  protected retryLoad(): void {
    this.loadOptions();
  }

  protected close(): void {
    void this.router.navigate(['/cards', this.id()]);
  }

  protected retry(): void {
    this.facade.retry();
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    const total = this.costMode() === 'TOTAL';
    if (total && (value.totalWithInterest === null || value.totalWithInterest.trim() === '')) {
      this.form.controls.totalWithInterest.setErrors({ required: true });
    }
    if (!total && percentTextToBps(value.rate) === null) {
      this.form.controls.rate.setErrors({ required: true });
    }
    if (this.form.invalid) return;
    const person = this.destination() === 'PERSON';
    this.facade.save({
      cardId: this.id(),
      accountId: person ? null : value.accountId,
      beneficiaryPersonId: person ? value.personId : null,
      principal: value.principal ?? '',
      installments: value.installments ?? 1,
      totalWithInterest: total ? (value.totalWithInterest ?? '') : null,
      rateBps: total ? null : percentTextToBps(value.rate),
      firstInvoiceDate: value.firstInvoiceDate ?? todayIso(),
      channel: value.channel.trim() === '' ? null : value.channel.trim(),
    });
  }

  private changeDestination(destination: Destination): void {
    this.destination.set(destination);
    const { accountId, personId } = this.form.controls;
    accountId.setValidators(destination === 'ME' ? [Validators.required] : []);
    personId.setValidators(destination === 'PERSON' ? [Validators.required] : []);
    accountId.updateValueAndValidity();
    personId.updateValueAndValidity();
  }

  private changeCostMode(mode: CostMode): void {
    this.costMode.set(mode);
    const { totalWithInterest, rate } = this.form.controls;
    totalWithInterest.setValidators(mode === 'TOTAL' ? [Validators.required] : []);
    totalWithInterest.updateValueAndValidity();
    rate.updateValueAndValidity();
  }

  private applyProblem(problem: Problem): boolean {
    return applyProblemToForm(this.form, problem, CODE_TO_FIELD);
  }

  private loadOptions(): void {
    this.loadFailed.set(false);
    forkJoin({
      accounts: this.accountsFacade.loadAll('ACTIVE'),
      people: this.peopleFacade.loadAll('ACTIVE'),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ accounts, people }) => {
          this.accounts.set(accounts);
          this.people.set(people);
        },
        error: () => this.loadFailed.set(true),
      });
  }
}

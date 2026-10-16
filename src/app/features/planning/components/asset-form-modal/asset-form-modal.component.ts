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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';

import { FormModalComponent } from '~/app/common/components/form-modal/form-modal.component';
import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { DatePickerComponent } from '~/app/common/components/forms/date-picker/date-picker.component';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { SegmentedControlComponent } from '~/app/common/components/forms/segmented-control/segmented-control.component';
import { SwitchComponent } from '~/app/common/components/forms/switch/switch.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { dirtySignal } from '~/app/common/forms/dirty-signal';
import { applyProblemToForm } from '~/app/common/forms/problem-form';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import { AssetFormFacade } from '~/modules/assets/core/facades/asset-form.facade';
import {
  ASSET_CURRENCY,
  type Asset,
  type AssetAvailability,
  type AssetKind,
} from '~/modules/assets/core/types/asset';
import { todayIso } from '~/util/date';

const CODE_TO_FIELD: Readonly<Record<string, string>> = {
  ASSET_INVALID: 'availability',
};

@Component({
  selector: 'app-asset-form-modal',
  imports: [
    ReactiveFormsModule,
    FormModalComponent,
    TextFieldComponent,
    MoneyInputComponent,
    DatePickerComponent,
    SegmentedControlComponent,
    SwitchComponent,
  ],
  providers: [AssetFormFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-form-modal
      #modal
      [heading]="editing() ? t().netWorth.form.editTitle : t().netWorth.form.title"
      [dirty]="dirty()"
      [busy]="facade.saving()"
      (closed)="closed.emit()"
    >
      <form class="form" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate data-cy="asset-form">
        @if (banner(); as message) {
          <p class="banner" role="alert" data-cy="asset-form-error">{{ message }}</p>
        }
        <app-segmented-control
          formControlName="kind"
          fieldId="asset-form-kind"
          [options]="kindOptions()"
          [label]="t().netWorth.form.kind"
        />
        <app-text-field
          formControlName="name"
          fieldId="asset-form-name"
          autocomplete="off"
          [maxlength]="100"
          [label]="t().netWorth.form.name"
        />
        <app-text-field
          formControlName="employer"
          fieldId="asset-form-employer"
          autocomplete="off"
          [maxlength]="100"
          [mandatory]="false"
          [label]="t().netWorth.form.employer"
        />
        @if (!editing()) {
          <div class="pair">
            <app-money-input
              formControlName="balance"
              fieldId="asset-form-balance"
              [currency]="currency"
              [allowZero]="true"
              [label]="t().netWorth.form.balance"
            />
            <app-date-picker
              formControlName="balanceDate"
              fieldId="asset-form-balance-date"
              [label]="t().netWorth.form.balanceDate"
            />
          </div>
        } @else {
          <p class="hint" data-cy="asset-form-balance-note">{{ t().netWorth.form.balanceNote }}</p>
        }
        <app-money-input
          formControlName="monthlyDeposit"
          fieldId="asset-form-monthly-deposit"
          [currency]="currency"
          [mandatory]="false"
          [label]="t().netWorth.form.monthlyDeposit"
          [hint]="t().netWorth.form.monthlyDepositHint"
        />
        @if (isFgts()) {
          <p class="hint" data-cy="asset-form-fgts-note">
            {{ t().netWorth.form.availabilityHint }}
          </p>
        } @else {
          <app-segmented-control
            formControlName="availability"
            fieldId="asset-form-availability"
            [options]="availabilityOptions()"
            [label]="t().netWorth.form.availability"
          />
          @if (isAvailable()) {
            <app-switch
              formControlName="countsAsReserve"
              fieldId="asset-form-counts-as-reserve"
              [label]="t().netWorth.form.countsAsReserve"
            />
          }
        }
        <div class="actions">
          <button
            type="button"
            class="button"
            data-cy="asset-form-cancel"
            (click)="modal.requestClose()"
          >
            {{ t().netWorth.form.cancel }}
          </button>
          <button
            type="submit"
            class="button button--primary"
            data-cy="asset-form-save"
            [disabled]="facade.saving()"
            [attr.aria-busy]="facade.saving()"
          >
            {{ facade.saving() ? t().netWorth.form.saving : t().netWorth.form.save }}
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
export class AssetFormModalComponent {
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  protected readonly t = this.i18n.t;
  protected readonly facade = inject(AssetFormFacade);
  protected readonly currency = ASSET_CURRENCY;

  readonly asset = input<Asset | null>(null);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly editing = computed(() => this.asset() !== null);
  protected readonly form = new FormGroup({
    kind: new FormControl<string | null>('OTHER', [Validators.required]),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    employer: new FormControl<string | null>(null),
    balance: new FormControl<string | null>(null),
    balanceDate: new FormControl<string | null>(todayIso()),
    monthlyDeposit: new FormControl<string | null>(null),
    availability: new FormControl<string | null>('AVAILABLE', [Validators.required]),
    countsAsReserve: new FormControl(false, { nonNullable: true }),
  });
  protected readonly dirty = dirtySignal(this.form);

  private readonly values = toSignal(this.form.valueChanges.pipe(startWith(this.form.value)), {
    initialValue: this.form.value,
  });
  protected readonly isFgts = computed(() => this.values().kind === 'FGTS');
  protected readonly isAvailable = computed(() => this.values().availability === 'AVAILABLE');

  protected readonly kindOptions = computed<readonly ChoiceOption[]>(() => [
    { value: 'FGTS', label: this.t().netWorth.assets.kind.FGTS },
    { value: 'OTHER', label: this.t().netWorth.assets.kind.OTHER },
  ]);
  protected readonly availabilityOptions = computed<readonly ChoiceOption[]>(() => [
    { value: 'AVAILABLE', label: this.t().netWorth.assets.availability.AVAILABLE },
    { value: 'RESERVED', label: this.t().netWorth.assets.availability.RESERVED },
  ]);

  private readonly fieldHandled = signal(false);
  protected readonly banner = computed(() => {
    const problem = this.facade.problem();
    if (!problem || this.fieldHandled()) return null;
    return problemMessage(problem, this.t().errors);
  });

  constructor() {
    effect(() => {
      const asset = this.asset();
      untracked(() => {
        if (asset === null) return;
        this.form.patchValue({
          kind: asset.kind,
          name: asset.name,
          employer: asset.employer,
          monthlyDeposit: asset.monthlyDeposit?.amount ?? null,
          availability: asset.availability,
          countsAsReserve: asset.countsAsReserve,
        });
        this.form.markAsPristine();
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
        this.editing() ? this.t().netWorth.form.toastUpdated : this.t().netWorth.form.toast,
      );
      this.saved.emit();
    });
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    const name = value.name.trim();
    const kind = value.kind as AssetKind | null;
    if (this.form.invalid || name === '' || kind === null) return;
    const availability: AssetAvailability =
      kind === 'FGTS'
        ? 'RESERVED'
        : ((value.availability as AssetAvailability | null) ?? 'AVAILABLE');
    const monthlyDeposit =
      value.monthlyDeposit !== null && value.monthlyDeposit !== '' ? value.monthlyDeposit : null;
    const asset = this.asset();
    if (asset !== null) {
      this.facade.update(asset.id, {
        kind,
        name,
        employer: value.employer,
        monthlyDeposit,
        availability,
        countsAsReserve: kind === 'FGTS' ? false : value.countsAsReserve,
        version: asset.version,
      });
      return;
    }
    const balance = value.balance ?? '';
    if (balance === '' || value.balanceDate === null) return;
    this.facade.create({
      kind,
      name,
      employer: value.employer,
      balance,
      balanceDate: value.balanceDate,
      monthlyDeposit,
      availability,
      countsAsReserve: kind === 'FGTS' ? false : value.countsAsReserve,
    });
  }
}

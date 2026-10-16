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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { FormModalComponent } from '~/app/common/components/form-modal/form-modal.component';
import { DatePickerComponent } from '~/app/common/components/forms/date-picker/date-picker.component';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { dirtySignal } from '~/app/common/forms/dirty-signal';
import { applyProblemToForm } from '~/app/common/forms/problem-form';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { ToastService } from '~/app/common/services/toast.service';
import { AssetFormFacade } from '~/modules/assets/core/facades/asset-form.facade';
import { ASSET_CURRENCY, type Asset } from '~/modules/assets/core/types/asset';
import { todayIso } from '~/util/date';

@Component({
  selector: 'app-asset-balance-modal',
  imports: [ReactiveFormsModule, FormModalComponent, MoneyInputComponent, DatePickerComponent],
  providers: [AssetFormFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-form-modal
      #modal
      [heading]="heading()"
      [dirty]="dirty()"
      [busy]="facade.saving()"
      (closed)="closed.emit()"
    >
      <form
        class="form"
        [formGroup]="form"
        (ngSubmit)="onSubmit()"
        novalidate
        data-cy="asset-balance-form"
      >
        <p class="hint">{{ t().netWorth.balanceForm.description }}</p>
        @if (banner(); as message) {
          <p class="banner" role="alert" data-cy="asset-balance-error">{{ message }}</p>
        }
        <div class="pair">
          <app-money-input
            formControlName="balance"
            fieldId="asset-balance-value"
            [currency]="currency"
            [allowZero]="true"
            [label]="t().netWorth.balanceForm.balance"
          />
          <app-date-picker
            formControlName="date"
            fieldId="asset-balance-date"
            [label]="t().netWorth.balanceForm.date"
          />
        </div>
        <div class="actions">
          <button
            type="button"
            class="button"
            data-cy="asset-balance-cancel"
            (click)="modal.requestClose()"
          >
            {{ t().netWorth.balanceForm.cancel }}
          </button>
          <button
            type="submit"
            class="button button--primary"
            data-cy="asset-balance-save"
            [disabled]="facade.saving()"
            [attr.aria-busy]="facade.saving()"
          >
            {{ facade.saving() ? t().netWorth.balanceForm.saving : t().netWorth.balanceForm.save }}
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
export class AssetBalanceModalComponent {
  private readonly toast = inject(ToastService);
  protected readonly t = inject(I18nService).t;
  protected readonly facade = inject(AssetFormFacade);
  protected readonly currency = ASSET_CURRENCY;

  readonly asset = input.required<Asset>();

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly form = new FormGroup({
    balance: new FormControl<string | null>(null),
    date: new FormControl<string | null>(todayIso()),
  });
  protected readonly dirty = dirtySignal(this.form);
  protected readonly heading = computed(
    () => `${this.t().netWorth.balanceForm.title}: ${this.asset().name}`,
  );

  private readonly fieldHandled = signal(false);
  protected readonly banner = computed(() => {
    const problem = this.facade.problem();
    if (!problem || this.fieldHandled()) return null;
    return problemMessage(problem, this.t().errors);
  });

  constructor() {
    effect(() => {
      const problem = this.facade.problem();
      untracked(() =>
        this.fieldHandled.set(problem ? applyProblemToForm(this.form, problem) : false),
      );
    });
    this.facade.saved$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.toast.show(this.t().netWorth.balanceForm.toast);
      this.saved.emit();
    });
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    const balance = value.balance ?? '';
    if (this.form.invalid || balance === '' || value.date === null) return;
    this.facade.updateBalance(this.asset().id, { balance, date: value.date });
  }
}

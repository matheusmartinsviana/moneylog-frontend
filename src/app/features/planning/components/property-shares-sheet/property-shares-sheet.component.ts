import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { MoneyInputComponent } from '~/app/common/components/forms/money-input/money-input.component';
import { SelectComponent } from '~/app/common/components/forms/select/select.component';
import { SheetComponent } from '~/app/common/components/sheet/sheet.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import type { CommitmentItem } from '~/modules/commitments/core/types/commitment';
import type { Problem } from '~/util/api/problem';
import { formatMoney } from '~/util/money';

export interface SharesDraft {
  readonly mine: string;
  readonly coBuyerPersonId: string | null;
  readonly coBuyerAmount: string | null;
}

@Component({
  selector: 'app-property-shares-sheet',
  imports: [ReactiveFormsModule, SheetComponent, MoneyInputComponent, SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet
      cy="property-shares-sheet"
      [open]="item() !== null"
      [heading]="t().property.editShares.title"
      [description]="description()"
      [dismissable]="!busy()"
      (closed)="close()"
    >
      @if (item(); as current) {
        <form
          class="form"
          [formGroup]="form"
          (ngSubmit)="onSubmit()"
          novalidate
          data-cy="property-shares-form"
        >
          <app-money-input
            formControlName="mine"
            fieldId="property-share-mine"
            [currency]="current.amount.currency"
            [allowZero]="true"
            [label]="t().property.editShares.mine"
          />
          <app-select
            formControlName="coBuyer"
            fieldId="property-share-co-buyer"
            [options]="people()"
            [mandatory]="false"
            [emptyLabel]="t().property.editShares.coBuyerNone"
            [label]="t().property.editShares.coBuyer"
          />
          @if (hasCoBuyer()) {
            <app-money-input
              formControlName="coBuyerAmount"
              fieldId="property-share-co-buyer-amount"
              [currency]="current.amount.currency"
              [allowZero]="true"
              [label]="t().property.editShares.coBuyerAmount"
            />
          }
          @if (banner(); as message) {
            <p class="banner" role="alert" data-cy="property-shares-error">{{ message }}</p>
          }
          <div class="actions">
            <button
              type="button"
              class="button"
              data-cy="property-shares-cancel"
              [disabled]="busy()"
              (click)="close()"
            >
              {{ t().property.editShares.cancel }}
            </button>
            <button
              type="submit"
              class="button button--primary"
              data-cy="property-shares-save"
              [disabled]="busy()"
              [attr.aria-busy]="busy()"
            >
              {{ busy() ? t().property.editShares.saving : t().property.editShares.save }}
            </button>
          </div>
        </form>
      }
    </app-sheet>
  `,
  styles: `
    :host {
      display: contents;
    }

    .form {
      display: grid;
      gap: var(--space-4);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-2);
    }
  `,
})
export class PropertySharesSheetComponent {
  protected readonly t = inject(I18nService).t;

  readonly item = input<CommitmentItem | null>(null);
  readonly people = input<readonly ChoiceOption[]>([]);
  readonly busy = input(false);
  readonly problem = input<Problem | null>(null);

  readonly closed = output<void>();
  readonly saved = output<SharesDraft>();

  protected readonly form = new FormGroup({
    mine: new FormControl<string | null>(null),
    coBuyer: new FormControl<string | null>(null),
    coBuyerAmount: new FormControl<string | null>({ value: null, disabled: true }),
  });
  private readonly coBuyerValue = toSignal(this.form.controls.coBuyer.valueChanges, {
    initialValue: null,
  });
  protected readonly hasCoBuyer = computed(() => (this.coBuyerValue() ?? '') !== '');

  protected readonly description = computed(() => {
    const current = this.item();
    return current
      ? interpolate(this.t().property.editShares.description, {
          label: current.label,
          amount: formatMoney(current.amount),
        })
      : '';
  });
  protected readonly banner = computed(() => {
    const problem = this.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });

  constructor() {
    effect(() => {
      const enabled = this.hasCoBuyer();
      untracked(() => {
        const { coBuyerAmount } = this.form.controls;
        if (enabled) coBuyerAmount.enable({ emitEvent: false });
        else coBuyerAmount.disable({ emitEvent: false });
      });
    });
    effect(() => {
      const current = this.item();
      untracked(() => {
        if (current) this.reset(current);
      });
    });
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { mine, coBuyer, coBuyerAmount } = this.form.getRawValue();
    if (mine === null) return;
    this.saved.emit({
      mine,
      coBuyerPersonId: coBuyer || null,
      coBuyerAmount: coBuyer ? coBuyerAmount : null,
    });
  }

  protected close(): void {
    if (!this.busy()) this.closed.emit();
  }

  private reset(item: CommitmentItem): void {
    const shares = item.shares ?? [];
    const mine = shares.find((share) => share.personId === null);
    const other = shares.find((share) => share.personId !== null);
    this.form.reset({
      mine: mine?.amount.amount ?? item.amount.amount,
      coBuyer: other?.personId ?? null,
      coBuyerAmount: other?.amount.amount ?? null,
    });
  }
}

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
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';

import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { SheetComponent } from '~/app/common/components/sheet/sheet.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { problemMessage } from '~/app/common/i18n/problem-message';
import type { CommitmentClauses } from '~/modules/commitments/core/types/commitment';
import type { Problem } from '~/util/api/problem';
import { bpsToPercentText, percentTextToBps } from '~/util/ratio';

export interface ClausesDraft {
  readonly lateFeeBps: number;
  readonly monthlyInterestBps: number;
  readonly terminationRetentionBps: number;
  readonly notes: string | null;
}

@Component({
  selector: 'app-property-clauses-sheet',
  imports: [ReactiveFormsModule, SheetComponent, TextFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet
      cy="property-clauses-sheet"
      [open]="open()"
      [heading]="t().property.editClauses.title"
      [description]="t().property.editClauses.description"
      [dismissable]="!busy()"
      (closed)="close()"
    >
      @if (open()) {
        <form
          class="form"
          [formGroup]="form"
          (ngSubmit)="onSubmit()"
          novalidate
          data-cy="property-clauses-form"
        >
          <app-text-field
            formControlName="lateFee"
            fieldId="property-clause-late-fee"
            inputmode="decimal"
            autocomplete="off"
            [maxlength]="6"
            [label]="t().property.editClauses.lateFee"
            [hint]="t().property.editClauses.percentHint"
          />
          <app-text-field
            formControlName="monthlyInterest"
            fieldId="property-clause-interest"
            inputmode="decimal"
            autocomplete="off"
            [maxlength]="6"
            [label]="t().property.editClauses.monthlyInterest"
            [hint]="t().property.editClauses.percentHint"
          />
          <app-text-field
            formControlName="retention"
            fieldId="property-clause-retention"
            inputmode="decimal"
            autocomplete="off"
            [maxlength]="6"
            [label]="t().property.editClauses.retention"
            [hint]="t().property.editClauses.percentHint"
          />
          <app-text-field
            formControlName="notes"
            fieldId="property-clause-notes"
            autocomplete="off"
            [maxlength]="1000"
            [mandatory]="false"
            [label]="t().property.editClauses.notes"
          />
          @if (banner(); as message) {
            <p class="banner" role="alert" data-cy="property-clauses-error">{{ message }}</p>
          }
          <div class="actions">
            <button
              type="button"
              class="button"
              data-cy="property-clauses-cancel"
              [disabled]="busy()"
              (click)="close()"
            >
              {{ t().property.editClauses.cancel }}
            </button>
            <button
              type="submit"
              class="button button--primary"
              data-cy="property-clauses-save"
              [disabled]="busy()"
              [attr.aria-busy]="busy()"
            >
              {{ busy() ? t().property.editClauses.saving : t().property.editClauses.save }}
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
export class PropertyClausesSheetComponent {
  protected readonly t = inject(I18nService).t;

  readonly open = input.required<boolean>();
  readonly clauses = input<CommitmentClauses | null>(null);
  readonly busy = input(false);
  readonly problem = input<Problem | null>(null);

  readonly closed = output<void>();
  readonly saved = output<ClausesDraft>();

  private readonly percent = (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    return typeof value === 'string' && percentTextToBps(value) !== null
      ? null
      : { message: this.t().property.editClauses.percentInvalid };
  };

  protected readonly form = new FormGroup({
    lateFee: new FormControl('', { nonNullable: true, validators: [this.percent] }),
    monthlyInterest: new FormControl('', { nonNullable: true, validators: [this.percent] }),
    retention: new FormControl('', { nonNullable: true, validators: [this.percent] }),
    notes: new FormControl('', { nonNullable: true }),
  });
  protected readonly banner = computed(() => {
    const problem = this.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });

  constructor() {
    effect(() => {
      const open = this.open();
      const clauses = this.clauses();
      untracked(() => {
        if (!open) return;
        this.form.reset({
          lateFee: bpsToPercentText(clauses?.lateFeeBps ?? 0),
          monthlyInterest: bpsToPercentText(clauses?.monthlyInterestBps ?? 0),
          retention: bpsToPercentText(clauses?.terminationRetentionBps ?? 0),
          notes: clauses?.notes ?? '',
        });
      });
    });
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const lateFeeBps = percentTextToBps(value.lateFee);
    const monthlyInterestBps = percentTextToBps(value.monthlyInterest);
    const terminationRetentionBps = percentTextToBps(value.retention);
    if (lateFeeBps === null || monthlyInterestBps === null || terminationRetentionBps === null) {
      return;
    }
    this.saved.emit({
      lateFeeBps,
      monthlyInterestBps,
      terminationRetentionBps,
      notes: value.notes.trim() === '' ? null : value.notes,
    });
  }

  protected close(): void {
    if (!this.busy()) this.closed.emit();
  }
}

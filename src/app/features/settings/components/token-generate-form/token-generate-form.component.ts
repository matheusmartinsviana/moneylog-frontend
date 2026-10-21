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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import type { ChoiceOption } from '~/app/common/components/forms/choice-option';
import { SelectComponent } from '~/app/common/components/forms/select/select.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { problemMessage } from '~/app/common/i18n/problem-message';
import type { Account } from '~/modules/accounts/core/types/account';
import {
  QUICK_ENTRY_LABEL_MAX,
  QUICK_ENTRY_VALIDITY_DEFAULT_DAYS,
  QUICK_ENTRY_VALIDITY_OPTIONS_DAYS,
  type QuickEntryTokenInput,
} from '~/modules/quick-entry/core/types/quick-entry-token';
import type { Problem } from '~/util/api/problem';

@Component({
  selector: 'app-token-generate-form',
  imports: [ReactiveFormsModule, SelectComponent, TextFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './token-generate-form.component.html',
  styleUrl: './token-generate-form.component.css',
})
export class TokenGenerateFormComponent {
  protected readonly t = inject(I18nService).t;

  readonly accounts = input.required<readonly Account[]>();
  readonly submitting = input(false);
  readonly problem = input<Problem | null>(null);
  readonly resets = input(0);

  readonly generated = output<QuickEntryTokenInput>();
  readonly edited = output<void>();

  protected readonly form = new FormGroup({
    label: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(QUICK_ENTRY_LABEL_MAX)],
    }),
    accountId: new FormControl<string | null>(null, { validators: [Validators.required] }),
    validity: new FormControl<string | null>(String(QUICK_ENTRY_VALIDITY_DEFAULT_DAYS), {
      validators: [Validators.required],
    }),
  });
  protected readonly maxLength = QUICK_ENTRY_LABEL_MAX;

  protected readonly accountOptions = computed<readonly ChoiceOption[]>(() =>
    this.accounts().map((account) => ({ value: account.id, label: account.name })),
  );
  protected readonly validityOptions = computed<readonly ChoiceOption[]>(() =>
    QUICK_ENTRY_VALIDITY_OPTIONS_DAYS.map((days) => ({
      value: String(days),
      label: this.t().quickEntry.generate.validityOptions[`${days}`],
    })),
  );
  protected readonly message = computed(() => {
    const problem = this.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });

  private seenResets = 0;

  constructor() {
    effect(() => {
      const accounts = this.accounts();
      untracked(() => {
        const current = this.form.controls.accountId.value;
        const stillThere = accounts.some((account) => account.id === current);
        if (!stillThere) {
          const only = accounts.length === 1 ? accounts[0] : undefined;
          this.form.controls.accountId.setValue(only?.id ?? null, { emitEvent: false });
        }
      });
    });
    effect(() => {
      const resets = this.resets();
      untracked(() => {
        if (resets !== this.seenResets) {
          this.form.controls.label.reset('', { emitEvent: false });
          this.form.controls.validity.setValue(String(QUICK_ENTRY_VALIDITY_DEFAULT_DAYS), {
            emitEvent: false,
          });
        }
        this.seenResets = resets;
      });
    });
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.edited.emit());
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    const { label, accountId, validity } = this.form.getRawValue();
    const trimmed = label.trim();
    if (this.form.invalid || trimmed === '' || this.submitting() || !accountId || !validity) return;
    this.generated.emit({ label: trimmed, accountId, expiresInDays: Number(validity) });
  }
}

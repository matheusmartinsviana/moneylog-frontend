import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { DialogComponent } from '~/app/common/components/dialog/dialog.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import {
  QUICK_ENTRY_LABEL_MAX,
  type QuickEntryToken,
} from '~/modules/quick-entry/core/types/quick-entry-token';

@Component({
  selector: 'app-token-rename-dialog',
  imports: [ReactiveFormsModule, DialogComponent, TextFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './token-rename-dialog.component.html',
  styleUrl: './token-rename-dialog.component.css',
})
export class TokenRenameDialogComponent {
  protected readonly t = inject(I18nService).t;

  readonly token = input<QuickEntryToken | null>(null);
  readonly busy = input(false);

  readonly saved = output<string>();
  readonly cancelled = output<void>();

  protected readonly maxLength = QUICK_ENTRY_LABEL_MAX;
  protected readonly label = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(QUICK_ENTRY_LABEL_MAX)],
  });

  constructor() {
    effect(() => {
      const token = this.token();
      untracked(() => this.label.reset(token?.label ?? ''));
    });
  }

  protected submit(): void {
    this.label.markAsTouched();
    const value = this.label.value.trim();
    if (this.label.invalid || value === '' || this.busy()) return;
    this.saved.emit(value);
  }
}

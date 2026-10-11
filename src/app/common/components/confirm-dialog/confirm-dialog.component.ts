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

import { DialogComponent } from '~/app/common/components/dialog/dialog.component';
import { I18nService } from '~/app/common/i18n/i18n.service';

export type ConfirmTone = 'default' | 'risk';

let nextId = 0;

@Component({
  selector: 'app-confirm-dialog',
  imports: [DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
})
export class ConfirmDialogComponent {
  protected readonly t = inject(I18nService).t;

  readonly open = input.required<boolean>();
  readonly heading = input.required<string>();
  readonly description = input<string>();
  readonly confirmLabel = input.required<string>();
  readonly cancelLabel = input<string>();
  readonly requireReason = input(false);
  readonly reasonLabel = input<string>();
  readonly reasonMaxLength = input(200);
  readonly tone = input<ConfirmTone>('default');
  readonly busy = input(false);

  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  private readonly uid = ++nextId;
  protected readonly reasonId = `confirm-dialog-reason-${this.uid}`;
  protected readonly reasonHintId = `confirm-dialog-reason-hint-${this.uid}`;

  protected readonly reason = signal('');
  protected readonly canConfirm = computed(
    () => !this.busy() && (!this.requireReason() || this.reason().trim() !== ''),
  );

  constructor() {
    effect(() => {
      if (this.open()) untracked(() => this.reason.set(''));
    });
  }

  protected onReasonInput(event: Event): void {
    this.reason.set((event.target as HTMLTextAreaElement).value);
  }

  protected confirm(): void {
    if (this.canConfirm()) this.confirmed.emit(this.reason().trim());
  }

  protected cancel(): void {
    if (!this.busy()) this.cancelled.emit();
  }
}

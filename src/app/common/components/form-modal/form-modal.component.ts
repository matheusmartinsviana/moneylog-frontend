import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';

import { ConfirmDialogComponent } from '~/app/common/components/confirm-dialog/confirm-dialog.component';
import { SheetComponent } from '~/app/common/components/sheet/sheet.component';
import { I18nService } from '~/app/common/i18n/i18n.service';

@Component({
  selector: 'app-form-modal',
  imports: [SheetComponent, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet
      cy="form-modal"
      [open]="true"
      [heading]="heading()"
      [dismissable]="!busy()"
      (closed)="requestClose()"
    >
      <ng-content />
    </app-sheet>
    <app-confirm-dialog
      [open]="confirming()"
      [heading]="t().form.discard.title"
      [description]="t().form.discard.description"
      [confirmLabel]="t().form.discard.confirm"
      [cancelLabel]="t().form.discard.stay"
      tone="risk"
      (confirmed)="discard()"
      (cancelled)="confirming.set(false)"
    />
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class FormModalComponent {
  protected readonly t = inject(I18nService).t;

  readonly heading = input.required<string>();
  readonly dirty = input(false);
  readonly busy = input(false);

  readonly closed = output<void>();

  protected readonly confirming = signal(false);

  requestClose(): void {
    if (this.busy()) return;
    if (this.dirty()) this.confirming.set(true);
    else this.closed.emit();
  }

  protected discard(): void {
    this.confirming.set(false);
    this.closed.emit();
  }
}

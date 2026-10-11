import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import {
  ModalRole,
  OverlayLayout,
  OverlayPanelComponent,
} from '~/app/common/components/overlay/overlay-panel.component';

let nextId = 0;

@Component({
  selector: 'app-dialog',
  imports: [OverlayPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-overlay-panel
      mode="modal"
      [open]="open()"
      [label]="heading()"
      [modalRole]="dialogRole()"
      [layout]="layout()"
      [describedBy]="description() ? descriptionId : null"
      [dismissable]="dismissable()"
      [showClose]="showClose()"
      [scrollBody]="true"
      [cy]="cy()"
      [panelCy]="panelCy()"
      (closed)="closed.emit()"
    >
      @if (open()) {
        <div class="dialog__content">
          @if (description(); as text) {
            <p class="dialog__description" [id]="descriptionId">{{ text }}</p>
          }
          <ng-content />
        </div>
      }
    </app-overlay-panel>
  `,
  styles: `
    :host {
      display: contents;
    }

    .dialog__content {
      display: grid;
      gap: var(--space-4);
      padding: 0 var(--space-5) var(--space-5);
    }

    .dialog__description {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
  `,
})
export class DialogComponent {
  readonly open = input.required<boolean>();
  readonly heading = input.required<string>();
  readonly description = input<string>();
  readonly dialogRole = input<ModalRole>('dialog');
  readonly layout = input<OverlayLayout>('responsive-center');
  readonly dismissable = input(true);
  readonly showClose = input(true);
  readonly cy = input('dialog');
  readonly panelCy = input<string | null>(null);

  readonly closed = output<void>();

  protected readonly descriptionId = `dialog-description-${++nextId}`;
}

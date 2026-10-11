import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { DialogComponent } from '~/app/common/components/dialog/dialog.component';

@Component({
  selector: 'app-sheet',
  imports: [DialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog
      [open]="open()"
      [heading]="heading()"
      [description]="description()"
      [layout]="layout()"
      [dismissable]="dismissable()"
      [cy]="cy()"
      (closed)="closed.emit()"
    >
      <ng-content />
    </app-dialog>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class SheetComponent {
  readonly open = input.required<boolean>();
  readonly heading = input.required<string>();
  readonly description = input<string>();
  readonly desktop = input<'center' | 'side'>('center');
  readonly dismissable = input(true);
  readonly cy = input('sheet');
  readonly closed = output<void>();

  protected readonly layout = computed(() =>
    this.desktop() === 'side' ? ('responsive-side' as const) : ('responsive-center' as const),
  );
}

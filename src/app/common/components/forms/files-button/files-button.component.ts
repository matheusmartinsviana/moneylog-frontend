import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

import { IconComponent } from '~/app/common/components/icon/icon.component';

@Component({
  selector: 'app-files-button',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      #native
      type="file"
      hidden
      multiple
      tabindex="-1"
      aria-hidden="true"
      [attr.accept]="accept() ?? null"
      [attr.data-cy]="cy() + '-native'"
      (change)="onNative($event)"
    />
    <button
      type="button"
      class="button"
      [disabled]="disabled()"
      [attr.data-cy]="cy()"
      (click)="open()"
    >
      <app-icon [name]="icon()" [size]="18" />
      {{ label() }}
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .button {
      gap: var(--space-2);
    }
  `,
})
export class FilesButtonComponent {
  readonly label = input.required<string>();
  readonly cy = input.required<string>();
  readonly accept = input<string>();
  readonly disabled = input(false);
  readonly icon = input<'image' | 'plus'>('image');

  readonly picked = output<File[]>();

  private readonly native = viewChild.required<ElementRef<HTMLInputElement>>('native');

  open(): void {
    if (!this.disabled()) this.native().nativeElement.click();
  }

  protected onNative(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length > 0) this.picked.emit(files);
  }
}

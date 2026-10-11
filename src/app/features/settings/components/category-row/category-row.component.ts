import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  Injector,
  input,
  output,
  untracked,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import type { Category } from '~/modules/categories/core/types/category';

export const CATEGORY_NAME_MAX = 60;

@Component({
  selector: 'li[app-category-row]',
  imports: [ReactiveFormsModule, TextFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-row.component.html',
  styleUrl: './category-row.component.css',
  host: {
    class: 'row',
    '[attr.data-cy]': "'category-row-' + category().id",
    '(keydown)': 'onKeydown($event)',
  },
})
export class CategoryRowComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly t = inject(I18nService).t;

  readonly category = input.required<Category>();
  readonly editing = input(false);
  readonly serverCode = input<string | null>(null);
  readonly busy = input(false);

  readonly renameStart = output<Category>();
  readonly renameCancel = output<void>();
  readonly renameSubmit = output<{ category: Category; name: string }>();
  readonly archive = output<Category>();
  readonly unarchive = output<Category>();

  protected readonly name = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(CATEGORY_NAME_MAX)],
  });
  protected readonly maxLength = CATEGORY_NAME_MAX;

  constructor() {
    effect(() => {
      if (!this.editing()) return;
      untracked(() => {
        this.name.setValue(this.category().name);
        this.name.markAsUntouched();
        afterNextRender(() => this.host.nativeElement.querySelector('input')?.focus(), {
          injector: this.injector,
        });
      });
    });
    effect(() => {
      const code = this.serverCode();
      if (code) {
        untracked(() => {
          this.name.setErrors({ server: code });
          this.name.markAsTouched();
        });
      }
    });
  }

  protected submit(): void {
    this.name.markAsTouched();
    if (this.name.invalid) return;
    const name = this.name.value.trim();
    if (name === this.category().name) {
      this.renameCancel.emit();
      return;
    }
    this.renameSubmit.emit({ category: this.category(), name });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!this.editing()) return;
    if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') {
      event.preventDefault();
      this.submit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.renameCancel.emit();
    }
  }
}

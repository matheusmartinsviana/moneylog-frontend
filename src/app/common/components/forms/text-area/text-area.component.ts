import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { FieldControl } from '~/app/common/components/forms/field-control';
import { FieldErrorComponent } from '~/app/common/components/forms/field-error/field-error.component';

export interface TextSelection {
  readonly start: number;
  readonly end: number;
}

@Component({
  selector: 'app-text-area',
  imports: [FieldErrorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.height]': "fillHeight() ? '100%' : null" },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextAreaComponent), multi: true },
  ],
  template: `
    <div class="field area" [class.area--fill]="fillHeight()">
      <label
        class="field__label"
        [class.visually-hidden]="hideLabel()"
        [id]="labelId()"
        [for]="controlId()"
        >{{ label() }}</label
      >
      <textarea
        #area
        class="input area__input"
        [class.area__input--mono]="monospace()"
        [id]="controlId()"
        [attr.data-cy]="fieldId()"
        [attr.rows]="rows()"
        [attr.maxlength]="maxlength() ?? null"
        [attr.aria-controls]="ariaControls() ?? null"
        [attr.aria-activedescendant]="ariaActivedescendant() ?? null"
        [attr.aria-autocomplete]="autocompleteList() ? 'list' : null"
        [attr.aria-haspopup]="autocompleteList() ? 'listbox' : null"
        [attr.aria-required]="mandatory()"
        [attr.aria-invalid]="showError()"
        [attr.aria-describedby]="describedByAll()"
        [attr.enterkeyhint]="enterkeyhint() ?? null"
        [placeholder]="placeholder() ?? ''"
        [disabled]="disabled()"
        [attr.spellcheck]="spellcheck()"
        (input)="onInput($event)"
        (keydown)="keyPressed.emit($event)"
        (keyup)="selectionChanged.emit()"
        (click)="selectionChanged.emit()"
        (select)="selectionChanged.emit()"
        (focus)="focused.emit()"
        (blur)="onTouched()"
      ></textarea>
      @if (hint(); as text) {
        <p class="field__hint" [id]="hintId()">{{ text }}</p>
      }
      <app-field-error [control]="control()" [errorId]="errorId()" />
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }

    .area__input {
      display: block;
      min-height: 5rem;
      padding: var(--space-3);
      line-height: var(--leading-normal);
      resize: none;
      tab-size: 2;
    }

    .area__input--mono {
      font-family: var(--font-mono);
      font-size: 1rem;
    }

    .area--fill {
      grid-template-rows: auto minmax(0, 1fr);
      height: 100%;
    }

    .area--fill .area__input {
      height: 100%;
    }

    .area__input:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }
  `,
})
export class TextAreaComponent extends FieldControl<string | null> {
  readonly rows = input(6);
  readonly maxlength = input<number>();
  readonly placeholder = input<string>();
  readonly mandatory = input(false);
  readonly monospace = input(false);
  readonly hideLabel = input(false);
  readonly fillHeight = input(false);
  readonly spellcheck = input<'true' | 'false'>('true');
  readonly enterkeyhint = input<string>();
  readonly describedByExtra = input<string>();
  readonly autocompleteList = input(false);
  readonly ariaControls = input<string>();
  readonly ariaActivedescendant = input<string>();

  readonly keyPressed = output<KeyboardEvent>();
  readonly selectionChanged = output<void>();
  readonly focused = output<void>();

  private readonly area = viewChild.required<ElementRef<HTMLTextAreaElement>>('area');
  protected readonly value = signal('');

  constructor() {
    super();
    effect(() => {
      const next = this.value();
      const el = this.area().nativeElement;
      if (el.value !== next) el.value = next;
    });
  }

  protected describedByAll(): string | null {
    const ids = [this.describedBy(), this.describedByExtra()].filter(Boolean);
    return ids.length > 0 ? ids.join(' ') : null;
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  protected onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.value.set(value);
    this.onChange(value);
    this.selectionChanged.emit();
  }

  focus(): void {
    this.area().nativeElement.focus();
  }

  selection(): TextSelection {
    const el = this.area().nativeElement;
    return { start: el.selectionStart, end: el.selectionEnd };
  }

  setSelection(start: number, end: number = start): void {
    const el = this.area().nativeElement;
    el.setSelectionRange(start, end);
  }

  replaceRange(
    start: number,
    end: number,
    text: string,
    selectStart: number = start + text.length,
    selectEnd: number = selectStart,
  ): void {
    const el = this.area().nativeElement;
    el.focus();
    el.setSelectionRange(start, end);
    let done = false;
    const doc = el.ownerDocument;
    if (typeof doc.execCommand === 'function') {
      try {
        done = doc.execCommand('insertText', false, text);
      } catch {
        done = false;
      }
    }
    if (!done) {
      el.setRangeText(text, start, end, 'end');
      this.value.set(el.value);
      this.onChange(el.value);
    }
    el.setSelectionRange(selectStart, selectEnd);
    this.selectionChanged.emit();
  }
}

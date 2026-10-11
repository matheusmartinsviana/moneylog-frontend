import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type FormSkeletonPiece =
  | 'field'
  | 'field-hint'
  | 'field-hint-2'
  | 'field-date'
  | 'field-segmented'
  | 'switch'
  | 'switch-2'
  | 'photos'
  | 'note'
  | 'note-2'
  | 'pair'
  | { readonly disclosure: readonly FormSkeletonPiece[] };

@Component({
  selector: 'app-form-skeleton',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #list let-items>
      @for (piece of items; track $index) {
        @if (piece === 'pair') {
          <div class="skeleton-form__pair">
            <ng-container *ngTemplateOutlet="one; context: { $implicit: 'field-date' }" />
            <ng-container *ngTemplateOutlet="one; context: { $implicit: 'field-date' }" />
          </div>
        } @else if (piece === 'note' || piece === 'note-2') {
          <div class="skeleton-form__note">
            <span class="sk">&nbsp;</span>
            @if (piece === 'note-2') {
              <br />
              <span class="sk">&nbsp;</span>
            }
          </div>
        } @else if (piece === 'photos') {
          <div class="field">
            <span class="field__label sk-label"><span class="sk">&nbsp;</span></span>
            <div class="sk skeleton-form__photos"></div>
          </div>
        } @else if (piece === 'switch' || piece === 'switch-2') {
          <div class="skeleton-form__switch">
            <div class="skeleton-form__switch-row">
              <span class="sk skeleton-form__switch-label">&nbsp;</span>
              <span class="sk skeleton-form__switch-track"></span>
            </div>
            <span class="field__hint sk-label">
              <span class="sk">&nbsp;</span>
              @if (piece === 'switch-2') {
                <br />
                <span class="sk">&nbsp;</span>
              }
            </span>
          </div>
        } @else if (piece.disclosure) {
          <div class="skeleton-form__disclosure">
            <div class="skeleton-form__disclosure-head"><span class="sk">&nbsp;</span></div>
            <div class="skeleton-form__more">
              <ng-container *ngTemplateOutlet="list; context: { $implicit: piece.disclosure }" />
            </div>
          </div>
        } @else {
          <ng-container *ngTemplateOutlet="one; context: { $implicit: piece }" />
        }
      }
    </ng-template>
    <ng-template #one let-kind>
      <div class="field">
        <span class="field__label sk-label"><span class="sk">&nbsp;</span></span>
        <div
          class="input sk"
          [class.skeleton-form__date]="kind === 'field-date'"
          [class.skeleton-form__segmented]="kind === 'field-segmented'"
        ></div>
        @if (kind === 'field-hint' || kind === 'field-hint-2') {
          <span class="field__hint sk-label">
            <span class="sk">&nbsp;</span>
            @if (kind === 'field-hint-2') {
              <br />
              <span class="sk">&nbsp;</span>
            }
          </span>
        }
      </div>
    </ng-template>

    <div
      class="skeleton-form"
      [class.skeleton-form--dense]="dense()"
      aria-hidden="true"
      data-cy="form-skeleton"
    >
      <ng-container *ngTemplateOutlet="list; context: { $implicit: pieces() }" />
      <div class="skeleton-form__actions">
        <div class="button sk skeleton-form__cancel"></div>
        <div class="button sk skeleton-form__save"></div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .skeleton-form {
      display: grid;
      gap: var(--space-4);
    }

    .skeleton-form--dense {
      gap: var(--space-3);
    }

    .sk-label > .sk {
      display: inline-block;
      width: 35%;
      min-width: 4.5rem;
      vertical-align: top;
    }

    .field__hint.sk-label > .sk {
      width: 25%;
    }

    .skeleton-form__note {
      font-size: var(--text-sm);
    }

    .skeleton-form__note > .sk {
      display: inline-block;
      width: 70%;
      vertical-align: top;
    }

    .skeleton-form__date {
      min-height: calc(2.75rem + 2px);
    }

    .skeleton-form__segmented {
      min-height: 0;
      height: 2.665rem;
    }

    .skeleton-form__photos {
      height: 12.275rem;
    }

    .skeleton-form__pair {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: var(--space-4);
    }

    .skeleton-form__switch {
      display: grid;
      font-size: var(--text-sm);
    }

    .skeleton-form__switch-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      min-height: 2.73rem;
    }

    .skeleton-form__switch-label {
      width: 40%;
    }

    .skeleton-form__switch-track {
      width: 2.5rem;
      height: 1.45rem;
      border-radius: var(--radius-pill, 999px);
    }

    .skeleton-form__disclosure-head {
      display: flex;
      align-items: center;
      min-height: 2.69rem;
    }

    .skeleton-form__disclosure-head > .sk {
      display: block;
      width: 8rem;
    }

    .skeleton-form__more {
      display: grid;
      gap: var(--space-4);
      padding-top: var(--space-2);
    }

    .skeleton-form__actions {
      position: sticky;
      bottom: 0;
      z-index: var(--z-raised);
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-2);
      margin-inline: calc(var(--space-5) * -1);
      padding: var(--space-3) var(--space-5);
      border-top: var(--border-width) solid var(--color-border);
      background-color: var(--color-surface);
    }

    .skeleton-form__cancel {
      width: 5.375rem;
    }

    .skeleton-form__save {
      width: 4.375rem;
    }
  `,
})
export class FormSkeletonComponent {
  readonly pieces = input.required<readonly FormSkeletonPiece[]>();
  readonly dense = input(false);
}

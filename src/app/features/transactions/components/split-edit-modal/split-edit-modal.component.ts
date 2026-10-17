import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { FormModalComponent } from '~/app/common/components/form-modal/form-modal.component';
import { dirtySignal } from '~/app/common/forms/dirty-signal';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { problemMessage } from '~/app/common/i18n/problem-message';
import {
  PeopleStatus,
  SplitFieldComponent,
} from '~/app/features/quick-add/components/split-field/split-field.component';
import {
  draftOf,
  newSplitGroup,
  patchSplit,
  startSplit,
} from '~/app/features/quick-add/components/split-field/split-form';
import type { Transaction } from '~/modules/transactions/core/types/transaction';
import type { Problem } from '~/util/api/problem';
import type { PersonRef } from '~/util/debt';
import { draftFromLines, type SplitInput, toSplitInput } from '~/util/split';

@Component({
  selector: 'app-split-edit-modal',
  imports: [ReactiveFormsModule, FormModalComponent, SplitFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-form-modal
      #modal
      [heading]="t().split.edit.title"
      [dirty]="dirty()"
      [busy]="saving()"
      (closed)="closed.emit()"
    >
      <form
        class="form"
        [formGroup]="group"
        (ngSubmit)="onSubmit()"
        novalidate
        data-cy="split-edit-form"
      >
        <p class="hint" data-cy="split-edit-description">{{ t().split.edit.description }}</p>
        <p class="hint" data-cy="split-edit-closed-note">{{ t().split.edit.closedNote }}</p>
        @if (banner(); as message) {
          <p class="banner" role="alert" data-cy="split-edit-error">{{ message }}</p>
        }
        <app-split-field
          [group]="group"
          [people]="people()"
          [peopleStatus]="peopleStatus()"
          [createPerson]="createPerson()"
          [currency]="currency()"
          idPrefix="split-edit"
          (peopleRetry)="peopleRetry.emit()"
        />
        <div class="actions">
          @if (hasSplit()) {
            <button
              type="button"
              class="button"
              data-cy="split-edit-clear"
              [disabled]="saving()"
              (click)="clear()"
            >
              {{ t().split.edit.clear }}
            </button>
          }
          <button
            type="button"
            class="button"
            data-cy="split-edit-cancel"
            (click)="modal.requestClose()"
          >
            {{ t().split.edit.cancel }}
          </button>
          <button
            type="submit"
            class="button button--primary"
            data-cy="split-edit-save"
            [disabled]="saving() || group.invalid"
            [attr.aria-busy]="saving()"
          >
            {{ saving() ? t().split.edit.saving : t().split.edit.save }}
          </button>
        </div>
      </form>
    </app-form-modal>
  `,
  styles: `
    :host {
      display: contents;
    }

    .form {
      display: grid;
      gap: var(--space-4);
    }

    .hint {
      margin: 0;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-2);
    }
  `,
})
export class SplitEditModalComponent implements OnInit {
  protected readonly t = inject(I18nService).t;

  readonly transaction = input.required<Transaction>();
  readonly people = input.required<readonly PersonRef[]>();
  readonly peopleStatus = input<PeopleStatus>('ready');
  readonly createPerson = input<((name: string) => Observable<PersonRef>) | null>(null);
  readonly saving = input(false);
  readonly problem = input<Problem | null>(null);

  readonly closed = output<void>();
  readonly saved = output<SplitInput>();
  readonly peopleRetry = output<void>();

  protected readonly group = newSplitGroup();
  protected readonly dirty = dirtySignal(this.group);
  protected readonly currency = computed(() => this.transaction().amount.currency);
  protected readonly hasSplit = computed(() => this.transaction().personShares.length > 0);
  protected readonly banner = computed(() => {
    const problem = this.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });

  ngOnInit(): void {
    const tx = this.transaction();
    if (tx.personShares.length > 0 && tx.splitMode !== null) {
      patchSplit(this.group, draftFromLines(tx.splitMode, tx.personShares));
    } else {
      startSplit(this.group);
    }
    this.group.markAsPristine();
  }

  protected onSubmit(): void {
    this.group.markAllAsTouched();
    if (this.group.invalid) return;
    const split = toSplitInput(draftOf(this.group));
    if (split !== null) this.saved.emit(split);
  }

  protected clear(): void {
    this.saved.emit({ mode: 'BPS', shares: [] });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { EmptyStateComponent } from '~/app/common/components/empty-state/empty-state.component';
import { ErrorStateComponent } from '~/app/common/components/error-state/error-state.component';
import { FormModalComponent } from '~/app/common/components/form-modal/form-modal.component';
import {
  FormSkeletonComponent,
  type FormSkeletonPiece,
} from '~/app/common/components/form-skeleton/form-skeleton.component';
import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { dirtySignal } from '~/app/common/forms/dirty-signal';
import { applyProblemToForm } from '~/app/common/forms/problem-form';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { problemMessage } from '~/app/common/i18n/problem-message';
import { EntityChanges } from '~/app/common/services/entity-changes';
import { ToastService } from '~/app/common/services/toast.service';
import { PersonFormFacade } from '~/modules/people/core/facades/person-form.facade';

const CODE_TO_FIELD: Readonly<Record<string, string>> = {
  PERSON_NAME_REQUIRED: 'name',
};

@Component({
  selector: 'app-person-form-page',
  imports: [
    FormSkeletonComponent,
    ReactiveFormsModule,
    FormModalComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    TextFieldComponent,
  ],
  providers: [PersonFormFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './person-form.page.html',
  styleUrl: './person-form.page.css',
})
export class PersonFormPage {
  protected readonly skeleton: readonly FormSkeletonPiece[] = ['field', 'field-hint'];

  private readonly router = inject(Router);
  private readonly changes = inject(EntityChanges);
  private readonly toast = inject(ToastService);
  protected readonly t = inject(I18nService).t;
  protected readonly facade = inject(PersonFormFacade);

  readonly id = input<string>();

  protected readonly editing = computed(() => this.id() !== undefined);
  protected readonly person = this.facade.person;

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
  });

  protected readonly dirty = dirtySignal(this.form);

  private readonly fieldHandled = signal(false);
  protected readonly banner = computed(() => {
    const problem = this.facade.problem();
    if (!problem || problem.code === 'VERSION_CONFLICT' || this.fieldHandled()) return null;
    return problemMessage(problem, this.t().errors);
  });
  protected readonly conflict = computed(() => this.facade.problem()?.code === 'VERSION_CONFLICT');
  protected readonly loadProblem = computed(() => {
    const state = this.facade.loadStatus();
    return state.status === 'error' ? state.problem : null;
  });
  protected readonly notFound = computed(() => this.loadProblem()?.status === 404);

  constructor() {
    effect(() => {
      const id = this.id();
      if (id !== undefined) untracked(() => this.facade.load(id));
    });
    effect(() => {
      const person = this.person();
      if (!person) return;
      untracked(() => this.form.setValue({ name: person.name, notes: person.notes ?? '' }));
    });
    this.form.controls.name.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((name) => this.facade.checkName(name, this.id() ?? null));
    effect(() => {
      const problem = this.facade.problem();
      if (!problem) {
        this.fieldHandled.set(false);
        return;
      }
      untracked(() => this.fieldHandled.set(applyProblemToForm(this.form, problem, CODE_TO_FIELD)));
    });
    this.facade.saved$.pipe(takeUntilDestroyed()).subscribe((person) => {
      this.toast.show(
        interpolate(
          this.editing() ? this.t().people.toast.updated : this.t().people.toast.created,
          { name: person.name },
        ),
      );
      this.changes.notify('people');
      void this.router.navigate(this.backUrl());
    });
  }

  private backUrl(): string[] {
    return this.editing() ? ['/people', this.id() as string] : ['/people'];
  }

  protected close(): void {
    void this.router.navigate(this.backUrl());
  }

  protected onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const input = {
      name: value.name.trim(),
      notes: value.notes.trim() === '' ? null : value.notes,
    };
    const person = this.person();
    const id = this.id();
    if (id !== undefined && person) {
      this.facade.save({ kind: 'update', id, input: { ...input, version: person.version } });
      return;
    }
    this.facade.save({ kind: 'create', input });
  }

  protected reloadLatest(): void {
    const id = this.id();
    if (id === undefined) return;
    this.facade.dismissProblem();
    this.facade.load(id);
  }

  protected retryLoad(): void {
    const id = this.id();
    if (id !== undefined) this.facade.load(id);
  }
}

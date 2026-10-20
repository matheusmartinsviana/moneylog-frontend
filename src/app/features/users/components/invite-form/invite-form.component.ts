import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { problemMessage } from '~/app/common/i18n/problem-message';
import type { Problem } from '~/util/api/problem';

export const INVITE_EMAIL_MAX = 254;

@Component({
  selector: 'app-invite-form',
  imports: [ReactiveFormsModule, TextFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invite-form.component.html',
  styleUrl: './invite-form.component.css',
})
export class InviteFormComponent {
  protected readonly t = inject(I18nService).t;

  readonly submitting = input(false);
  readonly problem = input<Problem | null>(null);
  readonly unavailable = input(false);
  readonly resets = input(0);

  readonly invited = output<string>();
  readonly resendExisting = output<string>();
  readonly edited = output<void>();

  protected readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email, Validators.maxLength(INVITE_EMAIL_MAX)],
  });
  protected readonly maxLength = INVITE_EMAIL_MAX;

  protected readonly message = computed(() => {
    const problem = this.problem();
    return problem ? problemMessage(problem, this.t().errors) : null;
  });
  protected readonly existingInvitationId = computed(() => {
    const problem = this.problem();
    return problem?.code === 'INVITATION_PENDING' ? (problem.invitationId ?? null) : null;
  });

  private seenResets = 0;

  constructor() {
    effect(() => {
      const resets = this.resets();
      untracked(() => {
        if (resets !== this.seenResets) this.email.reset('', { emitEvent: false });
        this.seenResets = resets;
      });
    });
    this.email.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.edited.emit());
  }

  protected submit(): void {
    this.email.markAsTouched();
    if (this.email.invalid || this.submitting()) return;
    this.invited.emit(this.email.value.trim());
  }
}

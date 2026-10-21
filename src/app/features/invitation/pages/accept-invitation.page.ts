import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { HTML_LANG } from '~/app/common/i18n/i18n';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { InvitationPrivacyComponent } from '~/app/features/invitation/components/invitation-privacy/invitation-privacy.component';
import { TypedTitleComponent } from '~/app/features/invitation/components/typed-title/typed-title.component';
import { takeInvitationToken } from '~/app/features/invitation/invitation-token';
import { InvitationAcceptFacade } from '~/modules/auth/core/facades/invitation-accept.facade';
import { formatInstant } from '~/util/date';

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_BYTES = 72;

@Component({
  selector: 'app-accept-invitation-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TextFieldComponent,
    InvitationPrivacyComponent,
    TypedTitleComponent,
  ],
  providers: [InvitationAcceptFacade],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './accept-invitation.page.html',
  styleUrl: './accept-invitation.page.css',
})
export class AcceptInvitationPage {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly i18n = inject(I18nService);
  protected readonly t = this.i18n.t;
  protected readonly accept = inject(InvitationAcceptFacade);

  protected readonly form = new FormGroup({
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  private readonly values = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  protected readonly ready = computed(() => {
    const state = this.accept.state();
    return state.status === 'ready' ? state : null;
  });
  protected readonly unavailableRetry = computed(() => {
    const state = this.accept.state();
    return state.status === 'unavailable' ? state.retryAfterSeconds : null;
  });
  protected readonly unavailableMessage = computed(() => {
    const copy = this.t().access.invitation.unavailable;
    const seconds = this.unavailableRetry();
    return seconds === null
      ? copy.description
      : interpolate(copy.rateLimited, { minutes: String(Math.max(1, Math.ceil(seconds / 60))) });
  });
  protected readonly validUntil = computed(() => {
    const state = this.ready();
    return state
      ? interpolate(this.t().access.invitation.validUntil, {
          when: formatInstant(state.expiresAt, HTML_LANG[this.i18n.language()]),
        })
      : '';
  });
  protected readonly invitedEmail = computed(() => {
    const state = this.ready();
    return state
      ? interpolate(this.t().access.invitation.invitedEmail, { email: state.email })
      : '';
  });

  protected readonly inviter = computed(() => this.ready()?.invitedByName?.trim() || null);
  protected readonly formTitle = computed(() => {
    const copy = this.t().access.invitation;
    const name = this.inviter();
    return name === null ? copy.title : interpolate(copy.titleInvitedBy, { name });
  });
  protected readonly nameStart = computed(() => {
    const name = this.inviter();
    return name === null ? null : [...this.formTitle()].length - [...name].length;
  });

  protected readonly rules = computed(() => {
    const { password = '' } = this.values();
    const email = this.ready()?.email ?? '';
    const copy = this.t().access.invitation;
    const typed = password.length > 0;
    return [
      {
        key: 'length',
        text: copy.ruleLength,
        met: typed && [...password].length >= MIN_PASSWORD_LENGTH,
      },
      {
        key: 'bytes',
        text: copy.ruleBytes,
        met: typed && new TextEncoder().encode(password).length <= MAX_PASSWORD_BYTES,
      },
      {
        key: 'email',
        text: copy.ruleNotEmail,
        met: typed && password.trim().toLowerCase() !== email.trim().toLowerCase(),
      },
    ];
  });

  protected readonly submitError = computed(() => {
    const state = this.accept.submitState();
    if (state.status !== 'failed') return null;
    const errors = this.t().access.invitation.errors;
    switch (state.failure.reason) {
      case 'weak_password':
        return errors.weakPassword;
      case 'rate_limited':
        return interpolate(errors.rateLimited, {
          minutes: String(Math.max(1, Math.ceil((state.failure.retryAfterSeconds ?? 60) / 60))),
        });
      case 'validation':
        return errors.validation;
      case 'network':
        return errors.network;
      default:
        return errors.unavailable;
    }
  });

  constructor() {
    const token = takeInvitationToken(this.document);
    if (this.router.url.includes('#')) {
      afterNextRender(
        () =>
          void this.router.navigateByUrl(this.router.url.split('#')[0] ?? '/convite', {
            replaceUrl: true,
          }),
        { injector: this.injector },
      );
    }
    this.accept.start(token);

    effect(() => {
      const status = this.accept.state().status;
      if (status === 'invalid' || status === 'unavailable' || status === 'existing_session') {
        afterNextRender(() => this.focus('page-title'), { injector: this.injector });
      }
    });

    effect(() => {
      const status = this.accept.state().status;
      if (status === 'done' || status === 'discarded') void this.router.navigateByUrl('/');
    });

    effect(() => {
      const state = this.accept.submitState();
      if (state.status === 'failed' && state.failure.reason === 'weak_password') {
        afterNextRender(() => this.focus('invitation-password'), { injector: this.injector });
      }
    });

    effect(() => {
      if (this.ready())
        afterNextRender(() => this.focus('invitation-password'), { injector: this.injector });
    });
  }

  protected onSubmit(): void {
    const { password, confirmPassword } = this.form.getRawValue();
    const confirm = this.form.controls.confirmPassword;
    confirm.updateValueAndValidity({ emitEvent: false });
    if (password !== confirmPassword) confirm.setErrors({ server: 'PASSWORD_MISMATCH' });
    if (this.form.invalid || this.accept.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.accept.submit(password);
  }

  private focus(cy: string): void {
    this.host.nativeElement.querySelector<HTMLElement>(`[data-cy="${cy}"]`)?.focus();
  }
}

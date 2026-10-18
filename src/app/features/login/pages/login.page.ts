import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { filter, map, switchMap, take, timer } from 'rxjs';

import { TextFieldComponent } from '~/app/common/components/forms/text-field/text-field.component';
import { I18nService } from '~/app/common/i18n/i18n.service';
import { interpolate } from '~/app/common/i18n/interpolate';
import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import { safeReturnUrl } from '~/modules/auth/core/types/return-url';

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_BYTES = 72;

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, TextFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  private readonly session = inject(SessionFacade);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  protected readonly t = inject(I18nService).t;

  readonly returnUrl = input<string>();
  readonly ended = input<string>();
  protected readonly sessionEnded = computed(() => this.ended() === '1');

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
  });

  protected readonly setupRequired = toSignal(this.session.passwordSetupRequired());
  protected readonly checking = computed(() => this.setupRequired() === undefined);
  protected readonly setupMode = computed(() => this.setupRequired() === true);

  protected readonly setupForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)],
    }),
    setupCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(512)],
    }),
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  private readonly setupValues = toSignal(this.setupForm.valueChanges, {
    initialValue: this.setupForm.getRawValue(),
  });

  protected readonly rules = computed(() => {
    const { newPassword = '', email = '' } = this.setupValues();
    const t = this.t().auth.setup;
    const typed = newPassword.length > 0;
    return [
      {
        key: 'length',
        text: t.ruleLength,
        met: typed && [...newPassword].length >= MIN_PASSWORD_LENGTH,
      },
      {
        key: 'bytes',
        text: t.ruleBytes,
        met: typed && new TextEncoder().encode(newPassword).length <= MAX_PASSWORD_BYTES,
      },
      {
        key: 'email',
        text: t.ruleNotEmail,
        met: typed && newPassword.trim().toLowerCase() !== email.trim().toLowerCase(),
      },
    ];
  });

  protected readonly setupSubmitting = computed(
    () => this.session.setupState().status === 'submitting',
  );
  protected readonly retryRemaining = signal(0);
  protected readonly setupBlocked = computed(
    () => this.setupSubmitting() || this.retryRemaining() > 0,
  );

  protected readonly setupError = computed(() => {
    const state = this.session.setupState();
    if (state.status !== 'failed') return null;
    const errors = this.t().auth.setup.errors;
    switch (state.failure.reason) {
      case 'invalid_setup_code':
        return errors.invalidCode;
      case 'rate_limited':
        return interpolate(errors.rateLimited, {
          seconds: String(state.failure.retryAfterSeconds ?? 60),
        });
      case 'validation':
        return errors.validation;
      case 'network':
        return errors.network;
      case 'weak_password':
        return null;
      default:
        return errors.unavailable;
    }
  });

  protected readonly submitting = computed(() => this.session.loginState().status === 'submitting');

  protected readonly errorMessage = computed(() => {
    const state = this.session.loginState();
    if (state.status !== 'failed') return null;
    const errors = this.t().auth.login.errors;
    const { failure } = state;
    switch (failure.reason) {
      case 'invalid_credentials':
        return errors.invalid;
      case 'rate_limited': {
        const seconds = failure.retryAfterSeconds ?? 60;
        return interpolate(errors.rateLimited, {
          minutes: String(Math.max(1, Math.ceil(seconds / 60))),
        });
      }
      case 'network':
        return errors.network;
      default:
        return errors.unavailable;
    }
  });

  constructor() {
    toObservable(this.session.setupState)
      .pipe(
        map((state) =>
          state.status === 'failed' && state.failure.reason === 'rate_limited'
            ? (state.failure.retryAfterSeconds ?? 60)
            : null,
        ),
        filter((seconds) => seconds !== null),
        switchMap((seconds) =>
          timer(0, 1000).pipe(
            take(seconds + 1),
            map((elapsed) => seconds - elapsed),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((remaining) => this.retryRemaining.set(remaining));

    effect(() => {
      const state = this.session.setupState();
      if (state.status === 'failed' && state.failure.reason === 'weak_password') {
        const control = this.setupForm.controls.newPassword;
        control.setErrors({ server: 'WEAK_PASSWORD' });
        control.markAsTouched();
        this.focus('setup-new-password');
      }
    });

    effect(() => {
      const target = this.checking() ? null : this.setupMode() ? 'setup-email' : 'login-email';
      if (target) afterNextRender(() => this.focus(target), { injector: this.injector });
    });

    this.session.signedIn$.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.session.signedInAsAnotherUser()) return;
      void this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.session.login({ email: email.trim(), password });
  }

  protected interpolateSeconds(seconds: number): string {
    return interpolate(this.t().auth.setup.retryIn, { seconds: String(seconds) });
  }

  private focus(cy: string): void {
    this.host.nativeElement.querySelector<HTMLElement>(`[data-cy="${cy}"]`)?.focus();
  }

  protected onSetupSubmit(): void {
    const { email, setupCode, newPassword, confirmPassword } = this.setupForm.getRawValue();
    const confirm = this.setupForm.controls.confirmPassword;
    confirm.updateValueAndValidity({ emitEvent: false });
    if (newPassword !== confirmPassword) confirm.setErrors({ server: 'PASSWORD_MISMATCH' });
    if (this.setupForm.invalid || this.setupBlocked()) {
      this.setupForm.markAllAsTouched();
      return;
    }
    this.session.setupPassword({ email: email.trim(), setupCode: setupCode.trim(), newPassword });
  }
}

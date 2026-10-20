import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import { AuthFailure } from '~/modules/auth/core/types/auth-failure';

export const INVITATION_TOKEN_MAX_LENGTH = 200;

export type InvitationAcceptState =
  | { readonly status: 'checking' }
  | { readonly status: 'invalid' }
  | { readonly status: 'unavailable'; readonly retryAfterSeconds: number | null }
  | { readonly status: 'existing_session' }
  | { readonly status: 'ready'; readonly email: string; readonly expiresAt: string }
  | { readonly status: 'discarded' }
  | { readonly status: 'done' };

export type InvitationSubmitState =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting' }
  | { readonly status: 'failed'; readonly failure: AuthFailure };

const CHECKING: InvitationAcceptState = { status: 'checking' };
const INVALID: InvitationAcceptState = { status: 'invalid' };
const IDLE: InvitationSubmitState = { status: 'idle' };

function asFailure(error: unknown): AuthFailure {
  return error instanceof AuthFailure ? error : new AuthFailure('unavailable');
}

@Injectable()
export class InvitationAcceptFacade {
  private readonly session = inject(SessionFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly checks = new Subject<void>();
  private readonly submissions = new Subject<string>();
  private readonly currentState = signal<InvitationAcceptState>(CHECKING);
  private readonly currentSubmit = signal<InvitationSubmitState>(IDLE);
  private token: string | null = null;

  readonly state = this.currentState.asReadonly();
  readonly submitState = this.currentSubmit.asReadonly();
  readonly submitting = computed(() => this.currentSubmit().status === 'submitting');

  constructor() {
    this.checks
      .pipe(
        switchMap(() => this.check()),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.currentState.set(state));

    this.submissions
      .pipe(
        exhaustMap((password) => this.accept(password)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  start(token: string | null): void {
    const usable = token !== null && token !== '' && token.length <= INVITATION_TOKEN_MAX_LENGTH;
    this.token = usable ? token : null;
    this.currentSubmit.set(IDLE);
    if (!usable) {
      this.currentState.set(INVALID);
    } else if (this.session.authenticated()) {
      this.currentState.set({ status: 'existing_session' });
    } else {
      this.verify();
    }
  }

  verify(): void {
    if (this.token === null) {
      this.currentState.set(INVALID);
      return;
    }
    this.currentState.set(CHECKING);
    this.checks.next();
  }

  signOutAndContinue(): void {
    this.currentState.set(CHECKING);
    this.session
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.verify());
  }

  keepCurrentSession(): void {
    this.token = null;
    this.currentState.set({ status: 'discarded' });
  }

  submit(password: string): void {
    this.submissions.next(password);
  }

  private check(): Observable<InvitationAcceptState> {
    const token = this.token;
    if (token === null) return of(INVALID);
    return this.session.previewInvitation(token).pipe(
      map((preview): InvitationAcceptState => ({
        status: 'ready',
        email: preview.email,
        expiresAt: preview.expiresAt,
      })),
      catchError((error: unknown) => {
        const failure = asFailure(error);
        if (failure.reason === 'invalid_invitation') {
          this.token = null;
          return of(INVALID);
        }
        return of<InvitationAcceptState>({
          status: 'unavailable',
          retryAfterSeconds: failure.reason === 'rate_limited' ? failure.retryAfterSeconds : null,
        });
      }),
      startWith(CHECKING),
    );
  }

  private accept(password: string): Observable<void> {
    const token = this.token;
    if (token === null) return of(undefined);
    this.currentSubmit.set({ status: 'submitting' });
    return this.session.acceptInvitation({ token, password }).pipe(
      map(() => {
        this.token = null;
        this.currentSubmit.set(IDLE);
        this.currentState.set({ status: 'done' });
      }),
      catchError((error: unknown) => {
        const failure = asFailure(error);
        if (failure.reason === 'invalid_invitation') {
          this.token = null;
          this.currentSubmit.set(IDLE);
          this.currentState.set(INVALID);
        } else {
          this.currentSubmit.set({ status: 'failed', failure });
        }
        return of(undefined);
      }),
    );
  }
}

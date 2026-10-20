import { computed, inject, Injectable, signal } from '@angular/core';
import {
  catchError,
  defaultIfEmpty,
  forkJoin,
  exhaustMap,
  finalize,
  map,
  Observable,
  of,
  share,
  Subject,
  switchMap,
  tap,
  throwError,
  timeout,
} from 'rxjs';

import { AuthGateway } from '~/modules/auth/core/interfaces/auth.gateway';
import {
  SESSION_END_HOOKS,
  SESSION_LOCAL_RESET_HOOKS,
  type SessionEndHook,
} from '~/modules/auth/core/interfaces/session-end-hook';
import { AuthFailure } from '~/modules/auth/core/types/auth-failure';
import type {
  AcceptInvitationInput,
  AuthToken,
  Credentials,
  InvitationPreview,
  SessionUser,
  SetupPasswordInput,
} from '~/modules/auth/core/types/auth-token';
import { readStorage, writeStorage } from '~/util/safe-storage';

export const LAST_USER_KEY = 'moneylog.lastUserId';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous' | 'unreachable';

export type LoginState =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting' }
  | { readonly status: 'failed'; readonly failure: AuthFailure };

export type SetupState = LoginState;

const IDLE: LoginState = { status: 'idle' };
const SUBMITTING: LoginState = { status: 'submitting' };

function asFailure(error: unknown): AuthFailure {
  return error instanceof AuthFailure ? error : new AuthFailure('unavailable');
}

@Injectable({ providedIn: 'root' })
export class SessionFacade {
  private readonly gateway = inject(AuthGateway);
  private readonly endHooks = inject(SESSION_END_HOOKS, { optional: true }) ?? [];
  private readonly localResetHooks = inject(SESSION_LOCAL_RESET_HOOKS, { optional: true }) ?? [];
  private readonly current = signal<SessionStatus>('unknown');
  private readonly currentUser = signal<SessionUser | null>(null);
  private readonly currentLogin = signal<LoginState>(IDLE);
  private readonly submissions = new Subject<Credentials>();
  private readonly currentSetup = signal<SetupState>(IDLE);
  private readonly setupSubmissions = new Subject<SetupPasswordInput>();
  private readonly signedInEvents = new Subject<void>();
  private readonly switchEvents = new Subject<void>();
  private accessToken: string | null = null;
  private previousUserId: string | null = null;
  private switchedOnLastSignIn = false;
  private inflight: Observable<string> | null = null;

  readonly status = this.current.asReadonly();
  readonly authenticated = computed(() => this.current() === 'authenticated');
  readonly user = this.currentUser.asReadonly();
  readonly role = computed(() => this.currentUser()?.role ?? null);
  readonly isOwner = computed(() => this.currentUser()?.role === 'OWNER');
  readonly loginState = this.currentLogin.asReadonly();
  readonly setupState = this.currentSetup.asReadonly();
  readonly signedIn$ = this.signedInEvents.asObservable();
  readonly userSwitched$ = this.switchEvents.asObservable();

  constructor() {
    this.submissions
      .pipe(
        exhaustMap((credentials) => {
          this.currentLogin.set(SUBMITTING);
          return this.gateway.login(credentials).pipe(
            switchMap((token) => this.authenticate(token)),
            map((): LoginState => IDLE),
            catchError((error: unknown) =>
              of<LoginState>({ status: 'failed', failure: asFailure(error) }),
            ),
          );
        }),
      )
      .subscribe((state) => {
        this.currentLogin.set(state);
        if (state.status === 'idle') this.signedInEvents.next();
      });

    this.setupSubmissions
      .pipe(
        exhaustMap((input) => {
          this.currentSetup.set(SUBMITTING);
          return this.gateway.setupPassword(input).pipe(
            switchMap((token) => this.authenticate(token)),
            map((): SetupState => IDLE),
            catchError((error: unknown) =>
              of<SetupState>({ status: 'failed', failure: asFailure(error) }),
            ),
          );
        }),
      )
      .subscribe((state) => {
        this.currentSetup.set(state);
        if (state.status === 'idle') this.signedInEvents.next();
      });
  }

  passwordSetupRequired(): Observable<boolean | null> {
    return this.gateway.passwordSetupRequired().pipe(catchError(() => of(null)));
  }

  setupPassword(input: SetupPasswordInput): void {
    this.setupSubmissions.next(input);
  }

  previewInvitation(token: string): Observable<InvitationPreview> {
    return this.gateway.previewInvitation(token);
  }

  acceptInvitation(input: AcceptInvitationInput): Observable<void> {
    return this.gateway.acceptInvitation(input).pipe(
      switchMap((token) => this.authenticate(token)),
      tap(() => this.signedInEvents.next()),
    );
  }

  token(): string | null {
    return this.accessToken;
  }

  login(credentials: Credentials): void {
    this.submissions.next(credentials);
  }

  async restore(): Promise<void> {
    this.current.set('unknown');
    await new Promise<void>((resolve) => {
      this.refresh().subscribe({
        next: () => resolve(),
        error: (error: unknown) => {
          const refused = asFailure(error).reason === 'refresh_invalid';
          this.current.set(refused ? 'anonymous' : 'unreachable');
          resolve();
        },
      });
    });
  }

  refresh(): Observable<string> {
    if (!this.inflight) {
      this.inflight = this.gateway.refresh().pipe(
        switchMap((token) => this.authenticate(token).pipe(map(() => token.accessToken))),
        catchError((error: unknown) => throwError(() => asFailure(error))),
        finalize(() => (this.inflight = null)),
        share(),
      );
    }
    return this.inflight;
  }

  refreshAfterUnauthorized(usedToken: string | null): Observable<string> {
    const token = this.accessToken;
    if (token !== null && token !== usedToken) return of(token);
    return this.refresh();
  }

  clear(): void {
    this.previousUserId = this.currentUser()?.id ?? this.previousUserId;
    this.accessToken = null;
    this.currentUser.set(null);
    this.current.set('anonymous');
  }

  expire(): void {
    this.clear();
    this.runHooks(this.localResetHooks).subscribe();
  }

  signedInAsAnotherUser(): boolean {
    return this.switchedOnLastSignIn;
  }

  logout(): Observable<void> {
    return this.runEndHooks().pipe(
      switchMap(() => this.gateway.logout()),
      catchError(() => of(undefined)),
      tap(() => this.clear()),
      map(() => undefined),
    );
  }

  private runEndHooks(): Observable<unknown> {
    return this.runHooks(this.endHooks);
  }

  private runHooks(hooks: readonly SessionEndHook[]): Observable<unknown> {
    if (hooks.length === 0) return of(undefined);
    return forkJoin(
      hooks.map((hook) =>
        hook().pipe(
          timeout(3000),
          catchError(() => of(undefined)),
          defaultIfEmpty(undefined),
        ),
      ),
    );
  }

  private authenticate(token: AuthToken): Observable<void> {
    const known = this.currentUser()?.id ?? this.previousUserId ?? readStorage(LAST_USER_KEY);
    const switched = known !== null && known !== token.user.id;
    const cleaned = switched ? this.runHooks(this.localResetHooks) : of(undefined);
    return cleaned.pipe(
      map(() => {
        this.switchedOnLastSignIn = switched;
        this.previousUserId = null;
        this.currentUser.set(token.user);
        this.accessToken = token.accessToken;
        this.current.set('authenticated');
        writeStorage(LAST_USER_KEY, token.user.id);
        if (switched) this.switchEvents.next();
      }),
    );
  }
}

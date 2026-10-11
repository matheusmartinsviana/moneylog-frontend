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
import { SESSION_END_HOOKS } from '~/modules/auth/core/interfaces/session-end-hook';
import { AuthFailure } from '~/modules/auth/core/types/auth-failure';
import type {
  AuthToken,
  Credentials,
  SetupPasswordInput,
} from '~/modules/auth/core/types/auth-token';

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
  private readonly current = signal<SessionStatus>('unknown');
  private readonly currentLogin = signal<LoginState>(IDLE);
  private readonly submissions = new Subject<Credentials>();
  private readonly currentSetup = signal<SetupState>(IDLE);
  private readonly setupSubmissions = new Subject<SetupPasswordInput>();
  private readonly signedInEvents = new Subject<void>();
  private accessToken: string | null = null;
  private inflight: Observable<string> | null = null;

  readonly status = this.current.asReadonly();
  readonly authenticated = computed(() => this.current() === 'authenticated');
  readonly loginState = this.currentLogin.asReadonly();
  readonly setupState = this.currentSetup.asReadonly();
  readonly signedIn$ = this.signedInEvents.asObservable();

  constructor() {
    this.submissions
      .pipe(
        exhaustMap((credentials) => {
          this.currentLogin.set(SUBMITTING);
          return this.gateway.login(credentials).pipe(
            tap((token) => this.authenticate(token)),
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
            tap((token) => this.authenticate(token)),
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
        tap((token) => this.authenticate(token)),
        map((token) => token.accessToken),
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
    this.accessToken = null;
    this.current.set('anonymous');
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
    if (this.endHooks.length === 0) return of(undefined);
    return forkJoin(
      this.endHooks.map((hook) =>
        hook().pipe(
          timeout(3000),
          catchError(() => of(undefined)),
          defaultIfEmpty(undefined),
        ),
      ),
    );
  }

  private authenticate(token: AuthToken): void {
    this.accessToken = token.accessToken;
    this.current.set('authenticated');
  }
}

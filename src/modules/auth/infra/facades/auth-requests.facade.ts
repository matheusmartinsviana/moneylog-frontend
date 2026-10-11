import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { AuthGateway } from '~/modules/auth/core/interfaces/auth.gateway';
import { AuthFailure } from '~/modules/auth/core/types/auth-failure';
import type {
  AuthToken,
  Credentials,
  SetupPasswordInput,
} from '~/modules/auth/core/types/auth-token';
import { AUTH_ENDPOINTS } from '~/modules/auth/infra/endpoints';
import type {
  AuthStatusResponse,
  AuthTokenResponse,
  LoginRequest,
  SetupPasswordRequest,
} from '~/modules/auth/infra/responses/auth-token.response';
import { FAKE_SESSION } from '~/modules/auth/mock-data/fake-session';
import { toProblem } from '~/util/api/problem';
import { API_MOCKS } from '~/util/api-mocks';

function toToken(response: AuthTokenResponse): AuthToken {
  return { accessToken: response.accessToken, expiresAt: response.expiresAt };
}

function loginFailure(error: unknown): Observable<never> {
  const problem = toProblem(error);
  const failure =
    problem.status === 401
      ? new AuthFailure('invalid_credentials')
      : problem.status === 429
        ? new AuthFailure('rate_limited', problem.retryAfterSeconds)
        : new AuthFailure(problem.status === 0 ? 'network' : 'unavailable');
  return throwError(() => failure);
}

function setupFailure(error: unknown): Observable<never> {
  const problem = toProblem(error);
  let failure: AuthFailure;
  if (problem.status === 0) failure = new AuthFailure('network');
  else if (problem.status === 429 || problem.code === 'TOO_MANY_ATTEMPTS')
    failure = new AuthFailure('rate_limited', problem.retryAfterSeconds);
  else if (problem.code === 'INVALID_SETUP_CODE') failure = new AuthFailure('invalid_setup_code');
  else if (problem.code === 'WEAK_PASSWORD') failure = new AuthFailure('weak_password');
  else if (problem.code === 'VALIDATION_FAILED') failure = new AuthFailure('validation');
  else failure = new AuthFailure('unavailable');
  return throwError(() => failure);
}

function refreshFailure(error: unknown): Observable<never> {
  const problem = toProblem(error);
  const reason =
    problem.status === 401 ? 'refresh_invalid' : problem.status === 0 ? 'network' : 'unavailable';
  return throwError(() => new AuthFailure(reason));
}

@Injectable({ providedIn: 'root' })
export class AuthRequestsFacade extends AuthGateway {
  private readonly http = inject(HttpClient);
  private readonly useMocks = inject(API_MOCKS);

  login(credentials: Credentials): Observable<AuthToken> {
    if (this.useMocks) return of(toToken(FAKE_SESSION));
    const body: LoginRequest = { email: credentials.email, password: credentials.password };
    return this.http
      .post<AuthTokenResponse>(AUTH_ENDPOINTS.login, body)
      .pipe(map(toToken), catchError(loginFailure));
  }

  passwordSetupRequired(): Observable<boolean> {
    if (this.useMocks) return of(false);
    return this.http.get<AuthStatusResponse>(AUTH_ENDPOINTS.status).pipe(
      map((response) => response.passwordSetupRequired),
      catchError((error: unknown) => {
        const problem = toProblem(error);
        return throwError(() => new AuthFailure(problem.status === 0 ? 'network' : 'unavailable'));
      }),
    );
  }

  setupPassword(input: SetupPasswordInput): Observable<AuthToken> {
    if (this.useMocks) return of(toToken(FAKE_SESSION));
    const body: SetupPasswordRequest = {
      email: input.email,
      setupCode: input.setupCode,
      newPassword: input.newPassword,
    };
    return this.http
      .post<AuthTokenResponse>(AUTH_ENDPOINTS.setupPassword, body)
      .pipe(map(toToken), catchError(setupFailure));
  }

  refresh(): Observable<AuthToken> {
    if (this.useMocks) return of(toToken(FAKE_SESSION));
    return this.http
      .post<AuthTokenResponse>(AUTH_ENDPOINTS.refresh, null)
      .pipe(map(toToken), catchError(refreshFailure));
  }

  logout(): Observable<void> {
    if (this.useMocks) return of(undefined);
    return this.http.post<void>(AUTH_ENDPOINTS.logout, null).pipe(
      map(() => undefined),
      catchError((error: unknown) => {
        const problem = toProblem(error);
        return throwError(() => new AuthFailure(problem.status === 0 ? 'network' : 'unavailable'));
      }),
    );
  }
}

import { EnvironmentProviders, inject, Provider, provideAppInitializer } from '@angular/core';
import { Observable, of } from 'rxjs';

import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import { AuthGateway } from '~/modules/auth/core/interfaces/auth.gateway';
import type {
  AcceptInvitationInput,
  AuthToken,
  Credentials,
  InvitationPreview,
  SessionUser,
  SetupPasswordInput,
} from '~/modules/auth/core/types/auth-token';
import { provideAuth } from '~/modules/auth/infra/auth.providers';
import { AUTH_ENDPOINTS } from '~/modules/auth/infra/endpoints';
import { API_MOCKS } from '~/util/api-mocks';

export const OWNER_USER: SessionUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'dono@moneylog.app',
  role: 'OWNER',
};

export const MEMBER_USER: SessionUser = {
  id: '00000000-0000-4000-8000-000000000002',
  email: 'convidado@moneylog.app',
  role: 'MEMBER',
};

export const aToken = (accessToken = 'token-1', user: SessionUser = OWNER_USER): AuthToken => ({
  accessToken,
  expiresAt: '2026-10-10T12:15:00Z',
  user,
});

export class AuthGatewayStub extends AuthGateway {
  login$: Observable<AuthToken> = of(aToken());
  refresh$: Observable<AuthToken> = of(aToken('token-2'));
  logout$: Observable<void> = of(undefined);
  setupRequired$: Observable<boolean> = of(false);
  setup$: Observable<AuthToken> = of(aToken('token-setup'));
  preview$: Observable<InvitationPreview> = of({
    email: MEMBER_USER.email,
    expiresAt: '2026-10-25T12:00:00Z',
    invitedByName: null,
  });
  accept$: Observable<AuthToken> = of(aToken('token-member', MEMBER_USER));
  readonly previews: string[] = [];
  readonly accepts: AcceptInvitationInput[] = [];
  readonly setups: SetupPasswordInput[] = [];
  readonly logins: Credentials[] = [];
  refreshes = 0;
  logouts = 0;

  login(credentials: Credentials): Observable<AuthToken> {
    this.logins.push(credentials);
    return this.login$;
  }

  passwordSetupRequired(): Observable<boolean> {
    return this.setupRequired$;
  }

  setupPassword(input: SetupPasswordInput): Observable<AuthToken> {
    this.setups.push(input);
    return this.setup$;
  }

  previewInvitation(token: string): Observable<InvitationPreview> {
    this.previews.push(token);
    return this.preview$;
  }

  acceptInvitation(input: AcceptInvitationInput): Observable<AuthToken> {
    this.accepts.push(input);
    return this.accept$;
  }

  refresh(): Observable<AuthToken> {
    this.refreshes++;
    return this.refresh$;
  }

  logout(): Observable<void> {
    this.logouts++;
    return this.logout$;
  }
}

export function provideAuthStub(stub: AuthGatewayStub = new AuthGatewayStub()): Provider[] {
  return [{ provide: AuthGateway, useValue: stub }];
}

export function provideAuthenticatedSession(): (Provider | EnvironmentProviders)[] {
  return [provideAuthStub(), provideAppInitializer(() => inject(SessionFacade).restore())];
}

export { AUTH_ENDPOINTS };

export function provideAuthOverHttp(): Provider[] {
  return [{ provide: API_MOCKS, useValue: false }, ...provideAuth()];
}

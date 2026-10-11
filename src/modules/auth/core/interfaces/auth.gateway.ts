import { Observable } from 'rxjs';

import type {
  AuthToken,
  Credentials,
  SetupPasswordInput,
} from '~/modules/auth/core/types/auth-token';

export abstract class AuthGateway {
  abstract login(credentials: Credentials): Observable<AuthToken>;

  abstract passwordSetupRequired(): Observable<boolean>;

  abstract setupPassword(input: SetupPasswordInput): Observable<AuthToken>;

  abstract refresh(): Observable<AuthToken>;

  abstract logout(): Observable<void>;
}

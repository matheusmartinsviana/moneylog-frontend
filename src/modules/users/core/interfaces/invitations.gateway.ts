import { Observable } from 'rxjs';

import type { Invitation } from '~/modules/users/core/types/access';

export abstract class InvitationsGateway {
  abstract list(): Observable<readonly Invitation[]>;
  abstract create(email: string): Observable<Invitation>;
  abstract resend(id: string): Observable<Invitation>;
  abstract revoke(id: string): Observable<Invitation>;
}

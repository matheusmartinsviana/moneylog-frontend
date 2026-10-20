import { Observable } from 'rxjs';

import type { ManagedUser } from '~/modules/users/core/types/access';

export abstract class UsersGateway {
  abstract list(): Observable<readonly ManagedUser[]>;
  abstract disable(id: string): Observable<ManagedUser>;
  abstract enable(id: string): Observable<ManagedUser>;
}

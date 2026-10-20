import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';

import { UsersGateway } from '~/modules/users/core/interfaces/users.gateway';
import type { ManagedUser } from '~/modules/users/core/types/access';
import { USERS_ENDPOINTS } from '~/modules/users/infra/endpoints';
import { toManagedUser } from '~/modules/users/infra/facades/access-response.mapper';
import type { ManagedUserResponse } from '~/modules/users/infra/responses/access.response';
import { MOCK_USERS } from '~/modules/users/mock-data/mock-access';
import { API_MOCKS } from '~/util/api-mocks';

@Injectable({ providedIn: 'root' })
export class UsersRequestsFacade extends UsersGateway {
  private readonly http = inject(HttpClient);
  private readonly useMocks = inject(API_MOCKS);

  list(): Observable<readonly ManagedUser[]> {
    if (this.useMocks) return of(MOCK_USERS);
    return this.http
      .get<ManagedUserResponse[]>(USERS_ENDPOINTS.list)
      .pipe(map((items) => items.map(toManagedUser)));
  }

  disable(id: string): Observable<ManagedUser> {
    if (this.useMocks) return of(this.mockChange(id, 'DISABLED'));
    return this.http
      .post<ManagedUserResponse>(USERS_ENDPOINTS.disable(id), null)
      .pipe(map(toManagedUser));
  }

  enable(id: string): Observable<ManagedUser> {
    if (this.useMocks) return of(this.mockChange(id, 'ACTIVE'));
    return this.http
      .post<ManagedUserResponse>(USERS_ENDPOINTS.enable(id), null)
      .pipe(map(toManagedUser));
  }

  private mockChange(id: string, status: ManagedUser['status']): ManagedUser {
    const user = MOCK_USERS.find((item) => item.id === id) ?? MOCK_USERS[1]!;
    return { ...user, status };
  }
}

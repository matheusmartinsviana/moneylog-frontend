import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';

import { InvitationsGateway } from '~/modules/users/core/interfaces/invitations.gateway';
import type { Invitation } from '~/modules/users/core/types/access';
import { INVITATIONS_ENDPOINTS } from '~/modules/users/infra/endpoints';
import { toInvitation } from '~/modules/users/infra/facades/access-response.mapper';
import type {
  InvitationInputRequest,
  InvitationResponse,
} from '~/modules/users/infra/responses/access.response';
import { MOCK_INVITATIONS, mockInvitationFor } from '~/modules/users/mock-data/mock-access';
import { API_MOCKS } from '~/util/api-mocks';

@Injectable({ providedIn: 'root' })
export class InvitationsRequestsFacade extends InvitationsGateway {
  private readonly http = inject(HttpClient);
  private readonly useMocks = inject(API_MOCKS);

  list(): Observable<readonly Invitation[]> {
    if (this.useMocks) return of(MOCK_INVITATIONS);
    return this.http
      .get<InvitationResponse[]>(INVITATIONS_ENDPOINTS.collection)
      .pipe(map((items) => items.map(toInvitation)));
  }

  create(email: string): Observable<Invitation> {
    if (this.useMocks) return of(mockInvitationFor(email));
    const body: InvitationInputRequest = { email };
    return this.http
      .post<InvitationResponse>(INVITATIONS_ENDPOINTS.collection, body)
      .pipe(map(toInvitation));
  }

  resend(id: string): Observable<Invitation> {
    if (this.useMocks) return of({ ...MOCK_INVITATIONS[0]!, id });
    return this.http
      .post<InvitationResponse>(INVITATIONS_ENDPOINTS.resend(id), null)
      .pipe(map(toInvitation));
  }

  revoke(id: string): Observable<Invitation> {
    if (this.useMocks) return of({ ...MOCK_INVITATIONS[0]!, id, status: 'REVOKED' });
    return this.http
      .delete<InvitationResponse>(INVITATIONS_ENDPOINTS.item(id))
      .pipe(map(toInvitation));
  }
}

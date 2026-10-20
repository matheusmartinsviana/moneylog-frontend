import { Provider } from '@angular/core';

import { InvitationsGateway } from '~/modules/users/core/interfaces/invitations.gateway';
import { UsersGateway } from '~/modules/users/core/interfaces/users.gateway';
import { InvitationsRequestsFacade } from '~/modules/users/infra/facades/invitations-requests.facade';
import { UsersRequestsFacade } from '~/modules/users/infra/facades/users-requests.facade';

export function provideUsers(): Provider[] {
  return [
    { provide: UsersGateway, useExisting: UsersRequestsFacade },
    { provide: InvitationsGateway, useExisting: InvitationsRequestsFacade },
  ];
}

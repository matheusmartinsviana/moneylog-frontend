import { Provider } from '@angular/core';

import { OwnerStatementGateway } from '~/modules/owner-statement/core/interfaces/owner-statement.gateway';
import { OwnerStatementRequestsFacade } from '~/modules/owner-statement/infra/facades/owner-statement-requests.facade';

export function provideOwnerStatement(): Provider[] {
  return [{ provide: OwnerStatementGateway, useExisting: OwnerStatementRequestsFacade }];
}

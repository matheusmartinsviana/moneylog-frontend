import { Provider } from '@angular/core';

import { AccountsGateway } from '~/modules/accounts/core/interfaces/accounts.gateway';
import { AccountsRequestsFacade } from '~/modules/accounts/infra/facades/accounts-requests.facade';

export function provideAccounts(): Provider[] {
  return [{ provide: AccountsGateway, useExisting: AccountsRequestsFacade }];
}

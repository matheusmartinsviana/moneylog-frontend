import { Provider } from '@angular/core';

import { NetWorthGateway } from '~/modules/net-worth/core/interfaces/net-worth.gateway';
import { NetWorthRequestsFacade } from '~/modules/net-worth/infra/facades/net-worth-requests.facade';

export function provideNetWorth(): Provider[] {
  return [{ provide: NetWorthGateway, useExisting: NetWorthRequestsFacade }];
}

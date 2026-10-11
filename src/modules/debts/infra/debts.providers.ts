import { Provider } from '@angular/core';

import { DebtsGateway } from '~/modules/debts/core/interfaces/debts.gateway';
import { DebtsRequestsFacade } from '~/modules/debts/infra/facades/debts-requests.facade';

export function provideDebts(): Provider[] {
  return [{ provide: DebtsGateway, useExisting: DebtsRequestsFacade }];
}

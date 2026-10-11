import { Provider } from '@angular/core';

import { TransactionsGateway } from '~/modules/transactions/core/interfaces/transactions.gateway';
import { TransactionsRequestsFacade } from '~/modules/transactions/infra/facades/transactions-requests.facade';

export function provideTransactions(): Provider[] {
  return [{ provide: TransactionsGateway, useExisting: TransactionsRequestsFacade }];
}

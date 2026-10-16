import { Provider } from '@angular/core';

import { IncomeGateway } from '~/modules/income/core/interfaces/income.gateway';
import { IncomeRequestsFacade } from '~/modules/income/infra/facades/income-requests.facade';

export function provideIncome(): Provider[] {
  return [{ provide: IncomeGateway, useExisting: IncomeRequestsFacade }];
}

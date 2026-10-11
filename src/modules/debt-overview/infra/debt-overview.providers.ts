import { Provider } from '@angular/core';

import { DebtOverviewGateway } from '~/modules/debt-overview/core/interfaces/debt-overview.gateway';
import { DebtOverviewRequestsFacade } from '~/modules/debt-overview/infra/facades/debt-overview-requests.facade';

export function provideDebtOverview(): Provider[] {
  return [{ provide: DebtOverviewGateway, useExisting: DebtOverviewRequestsFacade }];
}

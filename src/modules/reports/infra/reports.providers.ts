import { Provider } from '@angular/core';

import { ReportsGateway } from '~/modules/reports/core/interfaces/reports.gateway';
import { ReportsRequestsFacade } from '~/modules/reports/infra/facades/reports-requests.facade';

export function provideReports(): Provider[] {
  return [{ provide: ReportsGateway, useClass: ReportsRequestsFacade }];
}

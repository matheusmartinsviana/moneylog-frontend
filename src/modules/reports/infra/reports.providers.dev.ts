import { Provider } from '@angular/core';

import {
  DEMO_REPORTS_GATEWAY,
  ReportsGateway,
} from '~/modules/reports/core/interfaces/reports.gateway';
import { ReportsDemoFacade } from '~/modules/reports/infra/facades/reports-demo.facade';
import { ReportsRequestsFacade } from '~/modules/reports/infra/facades/reports-requests.facade';

export function provideReports(): Provider[] {
  return [
    { provide: ReportsGateway, useClass: ReportsRequestsFacade },
    { provide: DEMO_REPORTS_GATEWAY, useClass: ReportsDemoFacade },
  ];
}

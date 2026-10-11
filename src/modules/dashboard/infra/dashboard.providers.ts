import { Provider } from '@angular/core';

import { DashboardGateway } from '~/modules/dashboard/core/interfaces/dashboard.gateway';
import { DashboardRequestsFacade } from '~/modules/dashboard/infra/facades/dashboard-requests.facade';

export function provideDashboard(): Provider[] {
  return [{ provide: DashboardGateway, useExisting: DashboardRequestsFacade }];
}

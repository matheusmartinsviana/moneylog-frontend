import { Observable } from 'rxjs';

import type { DashboardSummary } from '~/modules/dashboard/core/types/dashboard-summary';
import type { Upcoming } from '~/modules/dashboard/core/types/upcoming';

export abstract class DashboardGateway {
  abstract getSummary(): Observable<DashboardSummary>;

  abstract getUpcoming(): Observable<Upcoming>;
}

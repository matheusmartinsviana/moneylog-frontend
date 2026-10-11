import { Observable } from 'rxjs';

import type { MonthlySummary } from '~/modules/monthly-summary/core/types/monthly-summary';

export abstract class MonthlySummaryGateway {
  abstract get(month: string): Observable<MonthlySummary>;
}

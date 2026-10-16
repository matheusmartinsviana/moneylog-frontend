import { Observable } from 'rxjs';

import type { MonthlySummary } from '~/modules/monthly-summary/core/types/monthly-summary';
import type { ViewMode } from '~/util/view-mode';

export abstract class MonthlySummaryGateway {
  abstract get(month: string, view?: ViewMode): Observable<MonthlySummary>;
}

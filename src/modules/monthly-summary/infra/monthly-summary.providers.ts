import { Provider } from '@angular/core';

import { MonthlySummaryGateway } from '~/modules/monthly-summary/core/interfaces/monthly-summary.gateway';
import { MonthlySummaryRequestsFacade } from '~/modules/monthly-summary/infra/facades/monthly-summary-requests.facade';

export function provideMonthlySummary(): Provider[] {
  return [{ provide: MonthlySummaryGateway, useExisting: MonthlySummaryRequestsFacade }];
}

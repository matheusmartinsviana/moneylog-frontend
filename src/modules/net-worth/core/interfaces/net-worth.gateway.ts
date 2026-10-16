import { Observable } from 'rxjs';

import type { NetWorthOverview } from '~/modules/net-worth/core/types/net-worth';

export abstract class NetWorthGateway {
  abstract overview(targetMonths: number | null): Observable<NetWorthOverview>;
}

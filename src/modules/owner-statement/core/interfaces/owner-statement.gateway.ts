import { Observable } from 'rxjs';

import type {
  OwnerStatement,
  OwnerStatementQuery,
} from '~/modules/owner-statement/core/types/owner-statement';

export abstract class OwnerStatementGateway {
  abstract get(query: OwnerStatementQuery): Observable<OwnerStatement>;
}

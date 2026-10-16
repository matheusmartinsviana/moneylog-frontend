import { Observable } from 'rxjs';

import type {
  CardCashOutInput,
  Debt,
  DebtDirection,
  DebtInput,
  DebtStatus,
  DebtUpdate,
} from '~/modules/debts/core/types/debt';
import type { Slice } from '~/util/api/slice';

export interface DebtsQuery {
  readonly direction?: DebtDirection;
  readonly status?: DebtStatus;
  readonly personId?: string;
  readonly overdue?: boolean;
  readonly page: number;
  readonly pageSize: number;
}

export abstract class DebtsGateway {
  abstract list(query: DebtsQuery): Observable<Slice<Debt>>;
  abstract get(id: string): Observable<Debt>;
  abstract create(input: DebtInput, idempotencyKey: string): Observable<Debt>;
  abstract createCardCashOut(input: CardCashOutInput, idempotencyKey: string): Observable<Debt>;
  abstract update(id: string, input: DebtUpdate): Observable<Debt>;
  abstract cancel(id: string, reason: string): Observable<Debt>;
  abstract void(id: string, reason: string): Observable<Debt>;
}

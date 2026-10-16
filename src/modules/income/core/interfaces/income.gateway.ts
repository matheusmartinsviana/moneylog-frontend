import { Observable } from 'rxjs';

import type {
  GeneratedIncomeOccurrence,
  IncomePreview,
  IncomeProfile,
  IncomeProfileInput,
  IncomeProfileStatus,
  IncomeProfileUpdate,
  TaxTable,
} from '~/modules/income/core/types/income';
import type { Slice } from '~/util/api/slice';

export abstract class IncomeGateway {
  abstract list(
    status: IncomeProfileStatus,
    page: number,
    pageSize: number,
  ): Observable<Slice<IncomeProfile>>;
  abstract create(input: IncomeProfileInput, idempotencyKey: string): Observable<IncomeProfile>;
  abstract update(id: string, input: IncomeProfileUpdate): Observable<IncomeProfile>;
  abstract archive(id: string): Observable<IncomeProfile>;
  abstract preview(id: string, month: string): Observable<IncomePreview>;
  abstract generate(
    id: string,
    from: string,
    to: string,
  ): Observable<readonly GeneratedIncomeOccurrence[]>;
  abstract taxTables(year: number): Observable<readonly TaxTable[]>;
}

import { Observable } from 'rxjs';

import type {
  ThirdPartyExpectedMonth,
  ThirdPartyExpectedMonthInput,
  ThirdPartyExpense,
  ThirdPartyExpenseInput,
  ThirdPartyReceipt,
  ThirdPartyReceiptInput,
  ThirdPartyReceivables,
} from '~/modules/third-parties/core/types/third-party';

export abstract class ThirdPartiesGateway {
  abstract receivables(month: string | null): Observable<ThirdPartyReceivables>;
  abstract mark(
    input: ThirdPartyExpenseInput,
    idempotencyKey: string,
  ): Observable<ThirdPartyExpense>;
  abstract recordReceipt(
    input: ThirdPartyReceiptInput,
    idempotencyKey: string,
  ): Observable<ThirdPartyReceipt>;
  abstract deleteReceipt(id: string): Observable<void>;
  abstract changeExpectedMonth(
    input: ThirdPartyExpectedMonthInput,
  ): Observable<ThirdPartyExpectedMonth>;
}

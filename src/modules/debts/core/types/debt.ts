import type { DebtDirection, DebtStatus, PersonRef } from '~/util/debt';
import type { Money } from '~/util/money';

export type { DebtDirection, DebtStatus, PersonRef };

export const DEBT_CURRENCY = 'BRL';

export type DebtKind = 'PERSONAL' | 'PAYROLL' | 'CARD_CASH_OUT';

export interface EffectiveRate {
  readonly monthlyBps: number;
  readonly annualBps: number;
}

export type DebtOrigin = 'WITH_MOVEMENT' | 'WITHOUT_MOVEMENT';

export type DebtVoidBlockedBy = 'DEBT_HAS_SETTLEMENTS' | 'DEBT_CLOSED' | 'HAS_ORIGIN_TRANSACTION';

export interface DebtSettlement {
  readonly transactionId: string;
  readonly amount: Money;
  readonly date: string;
  readonly active: boolean;
}

export interface Debt {
  readonly id: string;
  readonly kind: DebtKind;
  readonly channel: string | null;
  readonly effectiveRate: EffectiveRate | null;
  readonly person: PersonRef | null;
  readonly creditorName: string | null;
  readonly direction: DebtDirection;
  readonly origin: DebtOrigin;
  readonly originTransactionId: string | null;
  readonly principal: Money;
  readonly settled: Money;
  readonly outstanding: Money;
  readonly status: DebtStatus;
  readonly date: string;
  readonly expectedDate: string | null;
  readonly overdue: boolean;
  readonly description: string | null;
  readonly category: { readonly id: string; readonly name: string } | null;
  readonly closureDate: string | null;
  readonly closureReason: string | null;
  readonly settlements: readonly DebtSettlement[];
  readonly cancelable: boolean;
  readonly voidable: boolean;
  readonly voidBlockedBy: DebtVoidBlockedBy | null;
  readonly version: number;
}

export interface DebtInput {
  readonly personId: string | null;
  readonly creditorName?: string | null;
  readonly direction: DebtDirection;
  readonly principal: string;
  readonly date: string;
  readonly expectedDate: string | null;
  readonly description: string;
  readonly categoryId: string | null;
}

export interface DebtUpdate {
  readonly description: string;
  readonly expectedDate: string | null;
  readonly version: number;
}

export interface CardCashOutInput {
  readonly cardId: string;
  readonly accountId: string | null;
  readonly beneficiaryPersonId: string | null;
  readonly principal: string;
  readonly installments: number;
  readonly totalWithInterest: string | null;
  readonly rateBps: number | null;
  readonly firstInvoiceDate: string;
  readonly channel: string | null;
}

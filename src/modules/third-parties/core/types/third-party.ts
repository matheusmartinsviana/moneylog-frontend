import type { Money } from '~/util/money';

export const THIRD_PARTY_CURRENCY = 'BRL';

export interface ThirdPartyItem {
  readonly source: 'DEBT' | 'EXPENSE' | 'RECEIPT';
  readonly refId: string;
  readonly description: string | null;
  readonly date: string;
  readonly expectedDate: string | null;
  readonly owed: Money;
  readonly received: Money;
  readonly pending: Money;
  readonly status: string;
}

export interface ThirdPartyPerson {
  readonly personId: string;
  readonly name: string;
  readonly owed: Money;
  readonly received: Money;
  readonly pending: Money;
  readonly items: readonly ThirdPartyItem[];
}

export interface ThirdPartyMonth {
  readonly competence: string;
  readonly grossConsumption: Money;
  readonly refunds: Money;
  readonly personalNet: Money;
  readonly thirdPartyConsumption: Money;
  readonly thirdPartyReimbursed: Money;
  readonly thirdPartyPending: Money;
}

export interface ThirdPartyReceivables {
  readonly asOf: string;
  readonly owed: Money;
  readonly received: Money;
  readonly pending: Money;
  readonly people: readonly ThirdPartyPerson[];
  readonly month: ThirdPartyMonth;
}

export interface ThirdPartyReceipt {
  readonly id: string;
  readonly personId: string;
  readonly transactionId: string | null;
  readonly amount: Money;
  readonly receivedOn: string | null;
  readonly note: string | null;
}

export interface ThirdPartyReceiptInput {
  readonly personId: string;
  readonly transactionId: string | null;
  readonly amount: string;
  readonly receivedOn: string | null;
  readonly note: string | null;
}

export interface ThirdPartyExpense {
  readonly id: string;
  readonly transactionId: string;
  readonly personId: string;
  readonly note: string | null;
}

export interface ThirdPartyExpenseInput {
  readonly transactionId: string;
  readonly personId: string;
  readonly note: string | null;
}

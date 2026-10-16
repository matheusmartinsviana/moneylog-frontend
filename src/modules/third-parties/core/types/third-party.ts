import type { Money } from '~/util/money';

export const THIRD_PARTY_CURRENCY = 'BRL';

export type ThirdPartyItemSource = 'DEBT' | 'EXPENSE' | 'RECEIPT' | 'CARD_SHARE';

export const KNOWN_ITEM_SOURCES: readonly string[] = ['DEBT', 'EXPENSE', 'RECEIPT', 'CARD_SHARE'];

export interface ThirdPartyInstallment {
  readonly installmentId: string;
  readonly number: number;
  readonly total: number;
  readonly consumptionMonth: string;
  readonly dueMonth: string | null;
  readonly expectedMonth: string;
  readonly overridden: boolean;
  readonly owed: Money;
  readonly received: Money;
  readonly pending: Money;
}

export interface ThirdPartyExpectedMonth {
  readonly transactionId: string;
  readonly personId: string;
  readonly version: number;
  readonly installment: ThirdPartyInstallment;
}

export interface ThirdPartyExpectedMonthInput {
  readonly transactionId: string;
  readonly installmentId: string;
  readonly personId: string;
  readonly expectedMonth: string | null;
}

export interface ThirdPartyItem {
  readonly source: ThirdPartyItemSource;
  readonly refId: string;
  readonly description: string | null;
  readonly date: string;
  readonly expectedDate: string | null;
  readonly owed: Money;
  readonly received: Money;
  readonly pending: Money;
  readonly status: string;
  readonly installments: readonly ThirdPartyInstallment[];
}

export interface ThirdPartyPersonMonth {
  readonly competence: string;
  readonly owed: Money;
  readonly received: Money;
  readonly pending: Money;
}

export interface ThirdPartyPerson {
  readonly personId: string;
  readonly name: string;
  readonly owed: Money;
  readonly received: Money;
  readonly pending: Money;
  readonly months: readonly ThirdPartyPersonMonth[];
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

export type ReceiptSettlement = 'ACCOUNT' | 'ALREADY_IN_BALANCE';
export type ReceiptLedgerEffect = 'ACCOUNT_MOVEMENT' | 'EQUITY_OFFSET' | 'NONE';

export interface ThirdPartyReceipt {
  readonly id: string;
  readonly personId: string;
  readonly transactionId: string | null;
  readonly amount: Money;
  readonly receivedOn: string | null;
  readonly note: string | null;
  readonly settlement: ReceiptSettlement;
  readonly ledgerEffect: ReceiptLedgerEffect | null;
}

export interface ThirdPartyReceiptInput {
  readonly personId: string;
  readonly transactionId: string | null;
  readonly accountId?: string | null;
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

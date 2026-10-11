import type {
  PaymentMethod,
  TransactionType,
} from '~/modules/transactions/core/types/transaction-enums';
import type { Money } from '~/util/money';

export type EntryLens = 'CONSUMPTION' | 'INCOME';

export interface Entry {
  readonly transactionId: string;
  readonly transactionType: TransactionType;
  readonly date: string;
  readonly competence: string;
  readonly description: string;
  readonly category: { readonly id: string; readonly name: string };
  readonly installment: { readonly number: number; readonly total: number } | null;
  readonly via: 'ACCOUNT' | 'CARD';
  readonly method: PaymentMethod | null;
  readonly cardId: string | null;
  readonly accountId: string | null;
  readonly amount: Money;
}

export interface CategoryAmount {
  readonly category: { readonly id: string; readonly name: string };
  readonly amount: Money;
}

export interface EntryTotals {
  readonly total: Money;
  readonly byCategory: readonly CategoryAmount[];
}

export interface DebtEntry {
  readonly debtId: string;
  readonly date: string;
  readonly competence: string;
  readonly description: string;
  readonly category: { readonly id: string; readonly name: string };
  readonly amount: Money;
}

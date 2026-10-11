import type { Money } from '~/util/money';

export const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS', 'WALLET', 'INVESTMENT'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export type Liquidity = 'CASH' | 'INVESTMENT';
export type AccountStatus = 'ACTIVE' | 'ARCHIVED';

export interface Account {
  readonly id: string;
  readonly name: string;
  readonly type: AccountType;
  readonly liquidity: Liquidity;
  readonly institution: string | null;
  readonly openingBalance: Money;
  readonly openingDate: string;
  readonly currentBalance: Money;
  readonly status: AccountStatus;
  readonly openingEditable: boolean;
  readonly archivable: boolean;
  readonly reservedAmount: Money;
  readonly uncovered: boolean;
  readonly version: number;
}

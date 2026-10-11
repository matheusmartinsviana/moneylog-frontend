import type { AccountType } from '~/modules/accounts/core/types/account';

export interface AccountInput {
  readonly name: string;
  readonly type: AccountType;
  readonly institution: string | null;
  readonly openingBalance?: string;
  readonly openingDate?: string;
}

export interface AccountUpdate {
  readonly name: string;
  readonly institution: string | null;
  readonly type?: AccountType;
  readonly openingBalance?: string;
  readonly openingDate?: string;
  readonly version: number;
}

export const ACCOUNT_CURRENCY = 'BRL';

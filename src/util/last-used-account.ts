import { readStorage, writeStorage } from '~/util/safe-storage';

export const LAST_ACCOUNT_KEY = 'moneylog.quickAdd.lastAccountId';

export function readLastUsedAccount(): string | null {
  const value = readStorage(LAST_ACCOUNT_KEY);
  return value !== null && value !== '' ? value : null;
}

export function writeLastUsedAccount(accountId: string): void {
  writeStorage(LAST_ACCOUNT_KEY, accountId);
}

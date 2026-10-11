import { readStorage, writeStorage } from '~/util/safe-storage';

const KEY = 'moneylog.quickAdd.lastAccountId';

export function readLastUsedAccount(): string | null {
  const value = readStorage(KEY);
  return value !== null && value !== '' ? value : null;
}

export function writeLastUsedAccount(accountId: string): void {
  writeStorage(KEY, accountId);
}

import { readStorage, writeStorage } from '~/util/safe-storage';

const KEY = 'moneylog.quickAdd.lastCardId';

export function readLastUsedCard(): string | null {
  const value = readStorage(KEY);
  return value !== null && value !== '' ? value : null;
}

export function writeLastUsedCard(cardId: string): void {
  writeStorage(KEY, cardId);
}

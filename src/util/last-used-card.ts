import { readStorage, writeStorage } from '~/util/safe-storage';

export const LAST_CARD_KEY = 'moneylog.quickAdd.lastCardId';

export function readLastUsedCard(): string | null {
  const value = readStorage(LAST_CARD_KEY);
  return value !== null && value !== '' ? value : null;
}

export function writeLastUsedCard(cardId: string): void {
  writeStorage(LAST_CARD_KEY, cardId);
}

import type { Card } from '~/modules/cards/core/types/card';
import type { Money } from '~/util/money';

const SCALE = 6;

function scaled(money: Money): bigint {
  const negative = money.amount.startsWith('-');
  const [whole = '0', fraction = ''] = money.amount.replace('-', '').split('.');
  const value = BigInt(whole + fraction.padEnd(SCALE, '0').slice(0, SCALE));
  return negative ? -value : value;
}

function invoiceTotal(card: Card): bigint | null {
  return card.currentInvoice ? scaled(card.currentInvoice.total) : null;
}

export function pickFeaturedCard(cards: readonly Card[], rememberedId: string | null): Card | null {
  if (cards.length === 0) return null;
  const remembered = rememberedId === null ? undefined : cards.find((c) => c.id === rememberedId);
  if (remembered) return remembered;
  let best = cards[0]!;
  for (const card of cards.slice(1)) {
    const bestTotal = invoiceTotal(best);
    const total = invoiceTotal(card);
    if (total !== null && (bestTotal === null || total > bestTotal)) best = card;
  }
  return best;
}

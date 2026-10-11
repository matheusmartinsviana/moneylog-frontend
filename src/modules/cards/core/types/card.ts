import type { InvoiceSummary } from '~/modules/cards/core/types/invoice';
import type { Money } from '~/util/money';

export type CardStatus = 'ACTIVE' | 'ARCHIVED';

export const CARD_CURRENCY = 'BRL';

export interface Card {
  readonly id: string;
  readonly name: string;
  readonly institution: string | null;
  readonly limit: Money | null;
  readonly availableLimit: Money | null;
  readonly overLimit: boolean;
  readonly creditBalance: Money;
  readonly usedRatio: number | null;
  readonly closingDay: number;
  readonly dueDay: number;
  readonly defaultPaymentAccountId: string | null;
  readonly status: CardStatus;
  readonly currentInvoice: InvoiceSummary | null;
  readonly totalCommitted: Money;
  readonly committedFuture: Money;
  readonly closingConfirmed: boolean;
  readonly archivable: boolean;
  readonly version: number;
}

export interface CardInput {
  readonly name: string;
  readonly institution: string | null;
  readonly limit: string | null;
  readonly closingDay: number;
  readonly dueDay: number;
  readonly defaultPaymentAccountId: string | null;
}

export interface CardUpdate extends CardInput {
  readonly version: number;
  readonly confirmedEffectiveFrom: string | null;
}

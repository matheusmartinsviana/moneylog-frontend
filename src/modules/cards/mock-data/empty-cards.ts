import type {
  CardSliceResponse,
  InvoiceSliceResponse,
} from '~/modules/cards/infra/responses/card.response';

export const EMPTY_CARDS: CardSliceResponse = { items: [], hasNext: false };
export const EMPTY_INVOICES: InvoiceSliceResponse = { items: [], hasNext: false };

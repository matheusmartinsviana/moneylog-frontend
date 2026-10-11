import type { InvoiceRef } from '~/modules/cards/core/types/invoice';
import type { Money } from '~/util/money';

export const PURCHASE_MAX_INSTALLMENTS = 36;

export interface PurchasePreviewRequest {
  readonly amount: string;
  readonly installments: number;
  readonly date: string;
}

export interface PurchasePreviewInstallment {
  readonly number: number;
  readonly total: number;
  readonly amount: Money;
  readonly competence: string;
  readonly invoice: InvoiceRef;
  readonly lateEntry: boolean;
}

export type PurchaseWarning = 'LATE_ENTRY' | 'OVER_LIMIT' | 'FUTURE_DATE';

export interface PurchasePreview {
  readonly installments: readonly PurchasePreviewInstallment[];
  readonly total: Money;
  readonly availableLimitAfter: Money | null;
  readonly overLimit: boolean;
  readonly warnings: readonly PurchaseWarning[];
}

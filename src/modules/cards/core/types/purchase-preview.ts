import type { InvoiceRef } from '~/modules/cards/core/types/invoice';
import type { Money } from '~/util/money';
import type { PersonAmount, PersonShareLine, SplitInput, SplitMode } from '~/util/split';

export const PURCHASE_MAX_INSTALLMENTS = 36;

export interface PurchasePreviewRequest {
  readonly amount: string;
  readonly installments: number;
  readonly date: string;
  readonly split?: SplitInput | null;
}

export interface PurchasePreviewInstallment {
  readonly number: number;
  readonly total: number;
  readonly amount: Money;
  readonly competence: string;
  readonly invoice: InvoiceRef;
  readonly lateEntry: boolean;
  readonly myAmount: Money;
  readonly thirdPartyAmount: Money;
  readonly byPerson: readonly PersonAmount[];
}

export type PurchaseWarning = 'LATE_ENTRY' | 'OVER_LIMIT' | 'FUTURE_DATE' | 'FINANCING_PENDING';

export interface PurchasePreview {
  readonly installments: readonly PurchasePreviewInstallment[];
  readonly total: Money;
  readonly availableLimitAfter: Money | null;
  readonly overLimit: boolean;
  readonly splitMode: SplitMode | null;
  readonly shares: readonly PersonShareLine[];
  readonly warnings: readonly PurchaseWarning[];
}

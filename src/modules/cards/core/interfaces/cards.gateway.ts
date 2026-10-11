import { Observable } from 'rxjs';

import type { BillingChangePreview } from '~/modules/cards/core/types/billing-change-preview';
import type { Card, CardInput, CardStatus, CardUpdate } from '~/modules/cards/core/types/card';
import type {
  FutureInstallments,
  Invoice,
  InvoicePaymentInput,
  InvoiceSummary,
  PaymentPreview,
} from '~/modules/cards/core/types/invoice';
import type {
  PurchasePreview,
  PurchasePreviewRequest,
} from '~/modules/cards/core/types/purchase-preview';
import type { Slice } from '~/util/api/slice';

export interface CardsQuery {
  readonly status?: CardStatus;
  readonly page: number;
  readonly pageSize: number;
}

export interface InvoicesQuery {
  readonly from?: string;
  readonly to?: string;
  readonly page: number;
  readonly pageSize: number;
}

export abstract class CardsGateway {
  abstract list(query: CardsQuery): Observable<Slice<Card>>;
  abstract get(id: string): Observable<Card>;
  abstract create(input: CardInput): Observable<Card>;
  abstract update(id: string, input: CardUpdate): Observable<Card>;
  abstract archive(id: string): Observable<Card>;
  abstract unarchive(id: string): Observable<Card>;
  abstract setClosingConfirmation(
    id: string,
    confirmed: boolean,
    version: number,
  ): Observable<Card>;

  abstract listInvoices(cardId: string, query: InvoicesQuery): Observable<Slice<InvoiceSummary>>;
  abstract futureInstallments(cardId: string): Observable<FutureInstallments>;

  abstract previewPurchase(
    cardId: string,
    request: PurchasePreviewRequest,
  ): Observable<PurchasePreview>;

  abstract previewBillingChange(
    cardId: string,
    closingDay: number,
    dueDay: number,
  ): Observable<BillingChangePreview>;

  abstract getInvoice(id: string): Observable<Invoice>;

  abstract previewPayment(invoiceId: string, amount: string): Observable<PaymentPreview>;

  abstract payInvoice(
    invoiceId: string,
    input: InvoicePaymentInput,
    idempotencyKey: string,
  ): Observable<Invoice>;
}

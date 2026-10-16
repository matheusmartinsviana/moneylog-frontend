import type { BillingChangePreview } from '~/modules/cards/core/types/billing-change-preview';
import type { Card, CardInput, CardUpdate } from '~/modules/cards/core/types/card';
import type {
  FutureInstallments,
  Invoice,
  InvoiceItem,
  InvoicePaymentInput,
  InvoiceRef,
  InvoiceSummary,
  PaymentPreview,
} from '~/modules/cards/core/types/invoice';
import type {
  PurchasePreview,
  PurchasePreviewRequest,
} from '~/modules/cards/core/types/purchase-preview';
import type {
  BillingChangePreviewResponse,
  CardCreateRequest,
  CardResponse,
  CardUpdateRequest,
  FutureInstallmentsResponse,
  InvoiceItemResponse,
  InvoicePaymentRequest,
  InvoiceRefResponse,
  InvoiceResponse,
  InvoiceSummaryResponse,
  PaymentPreviewResponse,
  PurchasePreviewRequestBody,
  PurchasePreviewResponse,
} from '~/modules/cards/infra/responses/card.response';
import type { Money } from '~/util/money';
import type { PersonAmount, PersonShareLine, ShareInput } from '~/util/split';

const money = (value: { amount: string; currency: string }): Money => ({
  amount: value.amount,
  currency: value.currency,
});

export function toInvoiceSummary(response: InvoiceSummaryResponse): InvoiceSummary {
  return {
    id: response.id,
    cardId: response.cardId,
    referenceMonth: response.referenceMonth,
    periodStart: response.periodStart,
    closingDate: response.closingDate,
    dueDate: response.dueDate,
    status: response.status,
    total: money(response.total),
    carryIn: money(response.carryIn),
    paid: money(response.paid),
    outstanding: money(response.outstanding),
    creditCarry: money(response.creditCarry),
    hasLateEntries: response.hasLateEntries,
  };
}

export function toInvoiceItem(response: InvoiceItemResponse): InvoiceItem {
  return {
    kind: response.kind,
    transactionId: response.transactionId,
    description: response.description,
    number: response.number,
    totalInstallments: response.totalInstallments,
    amount: money(response.amount),
    date: response.date,
    lateEntry: response.lateEntry,
  };
}

const toPersonAmount = (value: { personId: string | null; amount: Money }): PersonAmount => ({
  personId: value.personId,
  amount: money(value.amount),
});

export function toShareLine(line: {
  personId: string | null;
  bps: number | null;
  amount: { amount: string; currency: string } | null;
}): PersonShareLine {
  return {
    personId: line.personId,
    bps: line.bps,
    amount: line.amount ? money(line.amount) : null,
  };
}

export function toInvoice(response: InvoiceResponse): Invoice {
  return {
    ...toInvoiceSummary(response),
    myShare: money(response.myShare),
    thirdPartyShare: money(response.thirdPartyShare),
    shareByPerson: response.shareByPerson.map(toPersonAmount),
    items: response.items.map(toInvoiceItem),
    payments: response.payments.map((payment) => ({
      transactionId: payment.transactionId,
      accountId: payment.accountId,
      amount: money(payment.amount),
      date: payment.date,
    })),
    documentAmount: response.documentAmount ? money(response.documentAmount) : null,
    documentDivergence: response.documentDivergence ? money(response.documentDivergence) : null,
    documentVersion: response.documentVersion ?? null,
  };
}

export function toInvoiceRef(response: InvoiceRefResponse): InvoiceRef {
  return {
    id: response.id,
    referenceMonth: response.referenceMonth,
    closingDate: response.closingDate,
    dueDate: response.dueDate,
    status: response.status,
  };
}

export function toCard(response: CardResponse): Card {
  return {
    id: response.id,
    name: response.name,
    institution: response.institution,
    limit: response.limit ? money(response.limit) : null,
    availableLimit: response.availableLimit ? money(response.availableLimit) : null,
    overLimit: response.overLimit,
    creditBalance: money(response.creditBalance),
    usedRatio: response.usedRatio ?? null,
    closingDay: response.closingDay,
    dueDay: response.dueDay,
    defaultPaymentAccountId: response.defaultPaymentAccountId,
    status: response.status,
    currentInvoice: response.currentInvoice ? toInvoiceSummary(response.currentInvoice) : null,
    totalCommitted: money(response.totalCommitted),
    committedFuture: money(response.committedFuture),
    closingConfirmed: response.closingConfirmed,
    archivable: response.archivable,
    autoDebit: response.autoDebit ?? null,
    brand: response.brand ?? null,
    bestPurchaseDay: response.bestPurchaseDay ?? null,
    lastDigits: [...(response.lastDigits ?? [])],
    version: response.version,
  };
}

export function toFutureInstallments(response: FutureInstallmentsResponse): FutureInstallments {
  return {
    total: money(response.total),
    byInvoice: response.byInvoice.map((invoice) => ({
      invoiceId: invoice.invoiceId,
      referenceMonth: invoice.referenceMonth,
      dueDate: invoice.dueDate,
      amount: money(invoice.amount),
      items: invoice.items.map(toInvoiceItem),
    })),
  };
}

export function toPurchasePreview(response: PurchasePreviewResponse): PurchasePreview {
  return {
    installments: response.installments.map((installment) => ({
      number: installment.number,
      total: installment.total,
      amount: money(installment.amount),
      competence: installment.competence,
      invoice: toInvoiceRef(installment.invoice),
      lateEntry: installment.lateEntry,
      myAmount: money(installment.myAmount),
      thirdPartyAmount: money(installment.thirdPartyAmount),
      byPerson: installment.byPerson.map(toPersonAmount),
    })),
    total: money(response.total),
    availableLimitAfter: response.availableLimitAfter ? money(response.availableLimitAfter) : null,
    overLimit: response.overLimit,
    splitMode: response.splitMode ?? null,
    shares: (response.shares ?? []).map(toShareLine),
    warnings: [...response.warnings],
  };
}

export function toBillingChangePreview(
  response: BillingChangePreviewResponse,
): BillingChangePreview {
  return {
    effectiveFromClosingDate: response.effectiveFromClosingDate,
    firstNewInvoice: {
      closingDate: response.firstNewInvoice.closingDate,
      dueDate: response.firstNewInvoice.dueDate,
    },
    movedInstallments: response.movedInstallments,
    movedCredits: response.movedCredits,
    notice: response.notice,
  };
}

export function toPaymentPreview(response: PaymentPreviewResponse): PaymentPreview {
  return {
    kind: response.kind,
    outstandingAfter: money(response.outstandingAfter),
    creditCarryAfter: money(response.creditCarryAfter),
  };
}

const BRL = 'BRL' as const;

export function toCreateRequest(input: CardInput): CardCreateRequest {
  const institution = input.institution?.trim() ?? '';
  return {
    name: input.name,
    institution: institution === '' ? null : institution,
    limit:
      input.limit === null || input.limit.trim() === ''
        ? null
        : { amount: input.limit, currency: BRL },
    closingDay: input.closingDay,
    dueDay: input.dueDay,
    defaultPaymentAccountId: input.defaultPaymentAccountId,
    ...(input.autoDebit === undefined ? {} : { autoDebit: input.autoDebit }),
    ...(input.brand === undefined
      ? {}
      : { brand: input.brand?.trim() ? input.brand.trim() : null }),
    ...(input.bestPurchaseDay === undefined ? {} : { bestPurchaseDay: input.bestPurchaseDay }),
    ...(input.lastDigits === undefined ? {} : { lastDigits: [...input.lastDigits] }),
  };
}

export function toUpdateRequest(input: CardUpdate): CardUpdateRequest {
  return {
    ...toCreateRequest(input),
    confirmedEffectiveFrom: input.confirmedEffectiveFrom,
    version: input.version,
  };
}

export function toShareBody(shares: readonly ShareInput[]): readonly ShareInput[] {
  return shares.map((share) => ({
    personId: share.personId,
    ...(share.bps === undefined ? {} : { bps: share.bps }),
    ...(share.amount === undefined ? {} : { amount: share.amount }),
  }));
}

export function toPurchasePreviewBody(request: PurchasePreviewRequest): PurchasePreviewRequestBody {
  return {
    amount: request.amount,
    installments: request.installments,
    date: request.date,
    ...(request.split
      ? { splitMode: request.split.mode, shares: [...toShareBody(request.split.shares)] }
      : {}),
  };
}

export function toPaymentBody(input: InvoicePaymentInput): InvoicePaymentRequest {
  return { accountId: input.accountId, amount: input.amount, date: input.date };
}

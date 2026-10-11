import type { Money } from '~/util/money';

export const INVOICE_STATUSES = ['FUTURE', 'OPEN', 'CLOSED', 'OVERDUE', 'PAID'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceSummary {
  readonly id: string;
  readonly cardId: string;
  readonly referenceMonth: string;
  readonly periodStart: string;
  readonly closingDate: string;
  readonly dueDate: string;
  readonly status: InvoiceStatus;
  readonly total: Money;
  readonly carryIn: Money;
  readonly paid: Money;
  readonly outstanding: Money;
  readonly creditCarry: Money;
  readonly hasLateEntries: boolean;
}

export type InvoiceItemKind = 'INSTALLMENT' | 'CREDIT';

export interface InvoiceItem {
  readonly kind: InvoiceItemKind;
  readonly transactionId: string;
  readonly description: string;
  readonly number: number | null;
  readonly totalInstallments: number | null;
  readonly amount: Money;
  readonly date: string;
  readonly lateEntry: boolean;
}

export interface InvoicePayment {
  readonly transactionId: string;
  readonly accountId: string;
  readonly amount: Money;
  readonly date: string;
}

export interface Invoice extends InvoiceSummary {
  readonly items: readonly InvoiceItem[];
  readonly payments: readonly InvoicePayment[];
}

export interface InvoiceRef {
  readonly id: string;
  readonly referenceMonth: string;
  readonly closingDate: string;
  readonly dueDate: string;
  readonly status: InvoiceStatus;
}

export interface FutureInstallmentsInvoice {
  readonly invoiceId: string;
  readonly referenceMonth: string;
  readonly dueDate: string;
  readonly amount: Money;
  readonly items: readonly InvoiceItem[];
}

export interface FutureInstallments {
  readonly total: Money;
  readonly byInvoice: readonly FutureInstallmentsInvoice[];
}

export interface InvoicePaymentInput {
  readonly accountId: string;
  readonly amount: string;
  readonly date: string;
}

export type PaymentKind = 'FULL' | 'PARTIAL' | 'OVERPAY' | 'PREPAY';

export interface PaymentPreview {
  readonly kind: PaymentKind;
  readonly outstandingAfter: Money;
  readonly creditCarryAfter: Money;
}

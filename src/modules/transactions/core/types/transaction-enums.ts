export const TRANSACTION_TYPES = [
  'EXPENSE',
  'INCOME',
  'TRANSFER',
  'INVESTMENT',
  'ADJUSTMENT',
  'REFUND',
  'CARD_PURCHASE',
  'INVOICE_PAYMENT',
  'LOAN_GIVEN',
  'MONEY_RECEIVED',
  'DEBT_PAYMENT',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const ACCOUNT_TRANSACTION_TYPES = [
  'EXPENSE',
  'INCOME',
  'TRANSFER',
  'INVESTMENT',
  'ADJUSTMENT',
  'REFUND',
] as const satisfies readonly TransactionType[];
export type AccountTransactionType = (typeof ACCOUNT_TRANSACTION_TYPES)[number];

export const PAYMENT_METHODS = ['CASH', 'DEBIT', 'PIX', 'TRANSFER', 'BOLETO', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type TransactionStatus = 'ACTIVE' | 'VOIDED';
export type TransactionSource = 'MANUAL' | 'IMPORT' | 'RECURRENCE' | 'ONGOING' | 'HISTORICAL';

export type AdjustmentDirection = 'INCREASE' | 'DECREASE';
export type InvestmentDirection = 'CONTRIBUTION' | 'REDEMPTION';
export type TransactionDirection = AdjustmentDirection | InvestmentDirection;
export type AdjustmentKind = 'CORRECTION' | 'YIELD';

export type VoidBlockedBy =
  | 'ACCOUNT_ARCHIVED'
  | 'HAS_ACTIVE_REFUNDS'
  | 'TRANSACTION_IN_CLOSED_INVOICE'
  | 'DEBT_HAS_SETTLEMENTS'
  | 'DEBT_CLOSED';

export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED';

export type InvoiceStatus = 'FUTURE' | 'OPEN' | 'CLOSED' | 'OVERDUE' | 'PAID';

import type { Transaction } from '~/modules/transactions/core/types/transaction';
import type { Money } from '~/util/money';

export type ActivityTone = 'expense' | 'income' | 'neutral';
export type ActivitySign = 'plus' | 'minus' | 'none';
export type ActivityIcon =
  | 'arrow-out'
  | 'arrow-in'
  | 'arrow-return'
  | 'arrows-opposite'
  | 'card'
  | 'chart'
  | 'person'
  | 'adjust'
  | 'generic';
export type ActivityLabelKey =
  | 'EXPENSE'
  | 'CARD_PURCHASE'
  | 'INCOME'
  | 'REFUND'
  | 'TRANSFER'
  | 'CONTRIBUTION'
  | 'REDEMPTION'
  | 'INVOICE_PAYMENT'
  | 'LOAN_GIVEN'
  | 'MONEY_RECEIVED'
  | 'DEBT_PAYMENT'
  | 'ADJUSTMENT'
  | 'UNKNOWN';

export interface ActivityKind {
  readonly labelKey: ActivityLabelKey;
  readonly icon: ActivityIcon;
  readonly sign: ActivitySign;
  readonly tone: ActivityTone;
}

export interface ActivityItem extends ActivityKind {
  readonly id: string;
  readonly type: string;
  readonly status: Transaction['status'];
  readonly date: string;
  readonly description: string;
  readonly category: string | null;
  readonly amount: Money;
  readonly scheduled: boolean;
  readonly voided: boolean;
  readonly installmentsTotal: number | null;
}

const UNKNOWN: ActivityKind = {
  labelKey: 'UNKNOWN',
  icon: 'generic',
  sign: 'none',
  tone: 'neutral',
};

const FIXED: Readonly<Record<string, ActivityKind>> = {
  EXPENSE: { labelKey: 'EXPENSE', icon: 'arrow-out', sign: 'minus', tone: 'expense' },
  CARD_PURCHASE: { labelKey: 'CARD_PURCHASE', icon: 'card', sign: 'minus', tone: 'expense' },
  INCOME: { labelKey: 'INCOME', icon: 'arrow-in', sign: 'plus', tone: 'income' },
  REFUND: { labelKey: 'REFUND', icon: 'arrow-return', sign: 'plus', tone: 'neutral' },
  TRANSFER: { labelKey: 'TRANSFER', icon: 'arrows-opposite', sign: 'none', tone: 'neutral' },
  INVOICE_PAYMENT: { labelKey: 'INVOICE_PAYMENT', icon: 'card', sign: 'minus', tone: 'neutral' },
  LOAN_GIVEN: { labelKey: 'LOAN_GIVEN', icon: 'person', sign: 'minus', tone: 'neutral' },
  MONEY_RECEIVED: { labelKey: 'MONEY_RECEIVED', icon: 'person', sign: 'plus', tone: 'neutral' },
  DEBT_PAYMENT: { labelKey: 'DEBT_PAYMENT', icon: 'person', sign: 'minus', tone: 'neutral' },
};

export function activityKind(type: string, direction: string | null): ActivityKind {
  const fixed = FIXED[type];
  if (fixed) return fixed;
  if (type === 'INVESTMENT') {
    if (direction === 'CONTRIBUTION')
      return { labelKey: 'CONTRIBUTION', icon: 'chart', sign: 'minus', tone: 'neutral' };
    if (direction === 'REDEMPTION')
      return { labelKey: 'REDEMPTION', icon: 'chart', sign: 'plus', tone: 'neutral' };
    return { labelKey: 'UNKNOWN', icon: 'chart', sign: 'none', tone: 'neutral' };
  }
  if (type === 'ADJUSTMENT') {
    const sign: ActivitySign =
      direction === 'INCREASE' ? 'plus' : direction === 'DECREASE' ? 'minus' : 'none';
    return { labelKey: 'ADJUSTMENT', icon: 'adjust', sign, tone: 'neutral' };
  }
  return UNKNOWN;
}

function installmentsTotalOf(transaction: Transaction): number | null {
  const total = transaction.installments[0]?.total ?? 0;
  return transaction.type === 'CARD_PURCHASE' && total > 1 ? total : null;
}

export function toActivityItem(transaction: Transaction, asOf: string): ActivityItem {
  const voided = transaction.status === 'VOIDED';
  const kind = activityKind(transaction.type, transaction.direction);
  return {
    ...kind,
    tone: voided ? 'neutral' : kind.tone,
    id: transaction.id,
    type: transaction.type,
    status: transaction.status,
    date: transaction.date,
    description: transaction.description,
    category: transaction.category?.name ?? null,
    amount: transaction.amount,
    scheduled: !voided && transaction.date > asOf,
    voided,
    installmentsTotal: installmentsTotalOf(transaction),
  };
}

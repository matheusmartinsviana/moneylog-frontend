import type { Money } from '~/util/money';

export const PURCHASE_GROUP_CURRENCY = 'BRL';

export type PurchaseGroupStatus = 'ACTIVE' | 'DONE';

export interface PurchaseGroupCardRef {
  readonly id: string;
  readonly name: string;
}

export interface PurchaseGroupMember {
  readonly transactionId: string;
  readonly card: PurchaseGroupCardRef;
  readonly description: string | null;
  readonly totalInstallments: number;
  readonly remainingInstallments: number;
  readonly installmentAmount: Money;
  readonly total: Money;
  readonly remaining: Money;
  readonly myRemaining: Money;
  readonly lastDueDate: string | null;
}

export interface PurchaseGroupDivergence {
  readonly declared: Money;
  readonly computed: Money;
  readonly difference: Money;
}

export interface PurchaseGroup {
  readonly id: string;
  readonly name: string;
  readonly interest: boolean;
  readonly status: PurchaseGroupStatus;
  readonly total: Money;
  readonly remaining: Money;
  readonly myRemaining: Money;
  readonly installmentAmountPerMonth: Money;
  readonly lastDueDate: string | null;
  readonly divergence: PurchaseGroupDivergence | null;
  readonly members: readonly PurchaseGroupMember[];
  readonly version: number;
}

export interface PurchaseGroupMemberInput {
  readonly cardId: string;
  readonly totalInstallments: number;
  readonly installmentAmount: string;
  readonly remainingInstallments: number | null;
  readonly firstInvoiceDate: string;
}

export interface PurchaseGroupInput {
  readonly name: string;
  readonly interest: boolean;
  readonly declaredTotal: string | null;
  readonly members: readonly PurchaseGroupMemberInput[];
}

export interface PurchaseGroupUpdate {
  readonly name: string;
  readonly interest: boolean;
  readonly version: number;
}

export interface PurchaseCommitmentMonth {
  readonly competence: string;
  readonly amount: Money;
  readonly mine: Money;
}

export interface PurchaseCommitments {
  readonly until: string;
  readonly committed: Money;
  readonly committedMine: Money;
  readonly byMonth: readonly PurchaseCommitmentMonth[];
}

export const COMMITMENT_HORIZONS = [6, 12, 24, 36] as const;
export const DEFAULT_COMMITMENT_HORIZON = 12;

export function commitmentUntil(today: string, months: number): string {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7)) - 1 + months;
  const date = new Date(Date.UTC(year, month, 1));
  return date.toISOString().slice(0, 7);
}

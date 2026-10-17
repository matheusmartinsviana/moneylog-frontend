import type { Money } from '~/util/money';

export const COMMITMENT_CURRENCY = 'BRL';

export type CommitmentKind = 'TRACKED_THIRD_PARTY' | 'LONG_TERM_PROJECT';
export const COMMITMENT_KINDS = [
  'TRACKED_THIRD_PARTY',
  'LONG_TERM_PROJECT',
] as const satisfies readonly CommitmentKind[];

export type CommitmentItemType = 'DOWN_PAYMENT' | 'INSTALLMENT' | 'EXTRAORDINARY' | 'FINANCING';
export const COMMITMENT_ITEM_TYPES = [
  'DOWN_PAYMENT',
  'INSTALLMENT',
  'EXTRAORDINARY',
  'FINANCING',
] as const satisfies readonly CommitmentItemType[];

export interface CommitmentShare {
  readonly personId: string | null;
  readonly amount: Money;
}

export interface CommitmentItem {
  readonly shares?: readonly CommitmentShare[];
  readonly sharesDefined?: boolean;
  readonly coBuyerPersonId?: string | null;
  readonly position: number;
  readonly label: string;
  readonly type: CommitmentItemType;
  readonly dueDate: string | null;
  readonly amount: Money;
  readonly paid: boolean;
  readonly paidOn: string | null;
}

export interface CommitmentMonth {
  readonly competence: string;
  readonly amount: Money;
}

export interface CommitmentClauses {
  readonly lateFeeBps: number;
  readonly monthlyInterestBps: number;
  readonly terminationRetentionBps: number;
  readonly terminationRetentionAmount: Money | null;
  readonly notes: string | null;
}

export interface CommitmentPersonTotals {
  readonly personId: string | null;
  readonly paid: Money;
  readonly pending: Money;
  readonly total: Money;
}

export interface Commitment {
  readonly clauses?: CommitmentClauses | null;
  readonly totalsByPerson?: readonly CommitmentPersonTotals[];
  readonly id: string;
  readonly kind: CommitmentKind;
  readonly name: string;
  readonly counterparty: string | null;
  readonly notes: string | null;
  readonly total: Money | null;
  readonly paid: Money | null;
  readonly nominalBalance: Money | null;
  readonly progress: string | null;
  readonly installmentsTotal: number | null;
  readonly installmentsPaid: number | null;
  readonly remainingInstallments: number | null;
  readonly nextDueDate: string | null;
  readonly directPending: Money | null;
  readonly financingPending: Money | null;
  readonly pendingByMonth: readonly CommitmentMonth[];
  readonly schedule: readonly CommitmentItem[];
  readonly version: number;
}

export interface CommitmentItemInput {
  readonly label: string;
  readonly type: CommitmentItemType;
  readonly dueDate: string | null;
  readonly amount: string;
  readonly paid: boolean;
  readonly paidOn: string | null;
}

export interface CommitmentInput {
  readonly kind: CommitmentKind;
  readonly name: string;
  readonly counterparty: string | null;
  readonly notes: string | null;
  readonly installmentsTotal: number | null;
  readonly installmentsPaid: number | null;
  readonly paidAmount: string | null;
  readonly nextDueDate: string | null;
  readonly schedule: readonly CommitmentItemInput[] | null;
}

export interface CommitmentProgressInput {
  readonly installmentsPaid: number;
  readonly paidAmount: string | null;
  readonly nextDueDate: string | null;
  readonly notes: string | null;
  readonly version: number;
}

export interface ShareInput {
  readonly personId: string | null;
  readonly amount: string;
}

export interface CommitmentSharesInput {
  readonly shares: readonly ShareInput[];
  readonly coBuyerPersonId: string | null;
  readonly version: number;
}

export interface CommitmentClausesInput {
  readonly lateFeeBps: number;
  readonly monthlyInterestBps: number;
  readonly terminationRetentionBps: number;
  readonly notes: string | null;
  readonly version: number;
}

export function isSharesDefined(item: CommitmentItem): boolean {
  return item.sharesDefined === true;
}

export interface CommitmentCsvFile {
  readonly blob: Blob;
  readonly filename: string;
}

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

export interface CommitmentItem {
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

export interface Commitment {
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

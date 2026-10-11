import type { DebtSummary } from '~/util/debt';
import type { Money } from '~/util/money';

export type PersonStatus = 'ACTIVE' | 'ARCHIVED';

export type PersonDirection = 'RECEIVABLE' | 'PAYABLE' | 'NONE';

export const PERSON_CURRENCY = 'BRL';

export interface Person {
  readonly id: string;
  readonly name: string;
  readonly notes: string | null;
  readonly archived: boolean;
  readonly net: Money;
  readonly direction: PersonDirection;
  readonly openDebts: number;
  readonly nextDueDate: string | null;
  readonly version: number;
}

export interface PersonDetail extends Person {
  readonly debts: readonly DebtSummary[];
}

export interface PersonInput {
  readonly name: string;
  readonly notes: string | null;
}

export interface PersonUpdate extends PersonInput {
  readonly version: number;
}

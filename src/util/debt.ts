import type { Money } from '~/util/money';

export type DebtDirection = 'RECEIVABLE' | 'PAYABLE';

export type DebtStatus = 'OPEN' | 'PARTIALLY_SETTLED' | 'SETTLED' | 'CANCELED' | 'VOIDED';

export function isOpenStatus(status: DebtStatus): boolean {
  return status === 'OPEN' || status === 'PARTIALLY_SETTLED';
}

export interface PersonRef {
  readonly id: string;
  readonly name: string;
}

export interface DebtSummary {
  readonly id: string;
  readonly person: PersonRef | null;
  readonly creditorName: string | null;
  readonly direction: DebtDirection;
  readonly status: DebtStatus;
  readonly principal: Money;
  readonly settled: Money;
  readonly outstanding: Money;
  readonly date: string;
  readonly expectedDate: string | null;
  readonly overdue: boolean;
  readonly description: string | null;
}

export interface DebtSummaryResponse {
  readonly id: string;
  readonly person: { readonly id: string; readonly name: string } | null;
  readonly creditorName?: string | null;
  readonly direction: DebtDirection;
  readonly status: DebtStatus;
  readonly principal: { readonly amount: string; readonly currency: string };
  readonly settled: { readonly amount: string; readonly currency: string };
  readonly outstanding: { readonly amount: string; readonly currency: string };
  readonly date: string;
  readonly expectedDate: string | null;
  readonly overdue: boolean;
  readonly description: string | null;
}

const money = (value: { amount: string; currency: string }): Money => ({
  amount: value.amount,
  currency: value.currency,
});

export function toDebtSummary(response: DebtSummaryResponse): DebtSummary {
  return {
    id: response.id,
    person: response.person ? { id: response.person.id, name: response.person.name } : null,
    creditorName: response.creditorName ?? null,
    direction: response.direction,
    status: response.status,
    principal: money(response.principal),
    settled: money(response.settled),
    outstanding: money(response.outstanding),
    date: response.date,
    expectedDate: response.expectedDate,
    overdue: response.overdue,
    description: response.description,
  };
}

import { Provider } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  OccurrencesQuery,
  RecurrencesGateway,
  RecurrencesQuery,
  SubscriptionsQuery,
} from '~/modules/recurrences/core/interfaces/recurrences.gateway';
import type {
  Occurrence,
  RealizedTransaction,
  RealizePayment,
  Recurrence,
  RecurrenceInput,
  RecurrenceSummary,
  RecurrenceUpdate,
} from '~/modules/recurrences/core/types/recurrence';
import type {
  RealizeForeign,
  Subscription,
  SubscriptionRecurrence,
  SubscriptionsPage,
} from '~/modules/recurrences/core/types/subscription';
import { brl } from '~/testing/accounts-testing';
import type { OccurrenceSlice, Slice } from '~/util/api/slice';

export function aRecurrence(overrides: Partial<Recurrence> = {}): Recurrence {
  return {
    id: 'rec-1',
    type: 'EXPENSE',
    amount: brl('119.00'),
    description: 'Internet',
    category: { id: 'cat-1', name: 'Moradia' },
    account: { id: 'acc-1', name: 'Nubank' },
    card: null,
    method: 'BOLETO',
    frequency: 'MONTHLY',
    interval: 1,
    unit: null,
    startDate: '2026-09-10',
    endDate: null,
    maxOccurrences: null,
    active: true,
    incomeCompetenceOffsetMonths: 0,
    ended: false,
    nextOccurrence: '2026-10-10',
    monthlyEstimate: brl('119.00'),
    splitMode: null,
    shares: [],
    version: 1,
    ...overrides,
  };
}

export function anOccurrence(overrides: Partial<Occurrence> = {}): Occurrence {
  return {
    recurrenceId: 'rec-1',
    date: '2026-10-10',
    status: 'PENDING',
    overdue: false,
    type: 'EXPENSE',
    direction: 'OUT',
    amount: brl('119.00'),
    description: 'Internet',
    categoryId: 'cat-1',
    accountId: 'acc-1',
    cardId: null,
    transactionId: null,
    ...overrides,
  };
}

export function aRealized(overrides: Partial<RealizedTransaction> = {}): RealizedTransaction {
  return {
    id: 'tx-rec-1',
    description: 'Internet',
    amount: brl('124.90'),
    date: '2026-10-10',
    card: null,
    invoice: null,
    ...overrides,
  };
}

export function aSummary(overrides: Partial<RecurrenceSummary> = {}): RecurrenceSummary {
  return {
    fixedCosts: brl('119.00'),
    recurringIncome: brl('0.00'),
    estimate: true,
    ...overrides,
  };
}

export function aSubscriptionRecurrence(
  overrides: Partial<SubscriptionRecurrence> = {},
): SubscriptionRecurrence {
  return {
    id: 'sub-1',
    type: 'EXPENSE',
    amount: brl('25.88'),
    description: 'Streaming',
    category: { id: 'cat-1', name: 'Lazer' },
    account: null,
    card: { id: 'card-1', name: 'Roxinho' },
    frequency: 'MONTHLY',
    interval: 1,
    unit: null,
    startDate: '2026-09-10',
    endDate: null,
    activeUntil: null,
    active: true,
    ended: false,
    nextOccurrence: '2026-10-10',
    scope: 'PERSONAL',
    channel: 'App store',
    overlapGroup: null,
    lastUsedOn: null,
    originalAmount: { amount: '5.00', currency: 'USD' },
    referenceFxRate: '5.000000',
    iofBps: 350,
    version: 1,
    ...overrides,
  };
}

export function aSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    recurrence: aSubscriptionRecurrence(),
    monthlyEquivalent: brl('25.88'),
    monthlyEquivalentMine: brl('25.88'),
    lastChargedAmount: null,
    ended: false,
    ...overrides,
  };
}

export function aSubscriptionsPage(overrides: Partial<SubscriptionsPage> = {}): SubscriptionsPage {
  return {
    items: [aSubscription()],
    hasNext: false,
    totalMonthly: brl('25.88'),
    totalMonthlyMine: brl('25.88'),
    byScope: [{ scope: 'PERSONAL', monthly: brl('25.88') }],
    overlaps: [],
    ...overrides,
  };
}

export class RecurrencesGatewayStub extends RecurrencesGateway {
  recurrences: Recurrence[] = [];
  occurrences: Occurrence[] = [];
  summary$: Observable<RecurrenceSummary> | null = null;
  readonly queries: RecurrencesQuery[] = [];
  readonly occurrenceQueries: OccurrencesQuery[] = [];
  readonly calls: string[] = [];
  readonly realizations: {
    recurrenceId: string;
    date: string;
    amount: string | null;
    key: string;
    payment: RealizePayment | null;
    foreign: RealizeForeign | null;
  }[] = [];
  subscriptions: SubscriptionsPage = aSubscriptionsPage();
  subscriptions$: Observable<SubscriptionsPage> | null = null;
  readonly subscriptionQueries: SubscriptionsQuery[] = [];
  readonly creates: RecurrenceInput[] = [];
  readonly createKeys: string[] = [];
  readonly updates: RecurrenceUpdate[] = [];
  next: Observable<Recurrence> | null = null;
  getResult: Observable<Recurrence> | null = null;
  listError: Observable<never> | null = null;
  occurrencesResult: Observable<OccurrenceSlice<Occurrence>> | null = null;
  overdueTruncated = false;
  realize$: Observable<RealizedTransaction> | null = null;
  skip$: Observable<Occurrence> | null = null;

  list(query: RecurrencesQuery): Observable<Slice<Recurrence>> {
    this.queries.push(query);
    if (this.listError) return this.listError;
    const filtered = this.recurrences.filter(
      (r) => query.active === undefined || r.active === query.active,
    );
    const start = (query.page - 1) * query.pageSize;
    const items = filtered.slice(start, start + query.pageSize);
    return of({ items, hasNext: start + query.pageSize < filtered.length });
  }

  get(id: string): Observable<Recurrence> {
    this.calls.push(`get:${id}`);
    return this.getResult ?? of(this.recurrences.find((r) => r.id === id) ?? aRecurrence({ id }));
  }

  create(input: RecurrenceInput, idempotencyKey: string): Observable<Recurrence> {
    this.createKeys.push(idempotencyKey);
    this.calls.push(`create:${input.description}`);
    this.creates.push(input);
    return this.next ?? of(aRecurrence({ id: 'rec-new', description: input.description }));
  }

  update(id: string, input: RecurrenceUpdate): Observable<Recurrence> {
    this.calls.push(`update:${id}:${input.version}`);
    this.updates.push(input);
    return (
      this.next ??
      of(aRecurrence({ id, description: input.description, version: input.version + 1 }))
    );
  }

  end(id: string, endDate: string | null): Observable<Recurrence> {
    this.calls.push(`end:${id}:${endDate ?? 'today'}`);
    return this.next ?? of(aRecurrence({ id, endDate: endDate ?? '2026-10-05' }));
  }

  deactivate(id: string): Observable<Recurrence> {
    this.calls.push(`deactivate:${id}`);
    return (
      this.next ??
      of(aRecurrence({ id, active: false, nextOccurrence: null, monthlyEstimate: brl('0.00') }))
    );
  }

  summary(): Observable<RecurrenceSummary> {
    this.calls.push('summary');
    return this.summary$ ?? of(aSummary());
  }

  listOccurrences(query: OccurrencesQuery): Observable<OccurrenceSlice<Occurrence>> {
    this.occurrenceQueries.push(query);
    if (this.occurrencesResult) return this.occurrencesResult;
    const filtered = this.occurrences.filter((o) => !query.status || o.status === query.status);
    const start = (query.page - 1) * query.pageSize;
    const items = filtered.slice(start, start + query.pageSize);
    return of({
      items,
      hasNext: start + query.pageSize < filtered.length,
      overdueTruncated: this.overdueTruncated,
    });
  }

  realize(
    recurrenceId: string,
    date: string,
    amount: string | null,
    key: string,
    payment: RealizePayment | null = null,
    foreign: RealizeForeign | null = null,
  ): Observable<RealizedTransaction> {
    this.calls.push(`realize:${recurrenceId}:${date}`);
    this.realizations.push({ recurrenceId, date, amount, key, payment, foreign });
    return this.realize$ ?? of(aRealized({ date, amount: brl(amount ?? '119.00') }));
  }

  listSubscriptions(query: SubscriptionsQuery): Observable<SubscriptionsPage> {
    this.subscriptionQueries.push(query);
    return this.subscriptions$ ?? of(this.subscriptions);
  }

  cancelSubscription(id: string, activeUntil: string): Observable<Recurrence> {
    this.calls.push(`cancel:${id}:${activeUntil}`);
    return this.next ?? of(aRecurrence({ id, endDate: activeUntil }));
  }

  skip(recurrenceId: string, date: string): Observable<Occurrence> {
    this.calls.push(`skip:${recurrenceId}:${date}`);
    return this.skip$ ?? of(anOccurrence({ recurrenceId, date, status: 'SKIPPED' }));
  }
}

export function provideRecurrencesStub(
  stub: RecurrencesGatewayStub = new RecurrencesGatewayStub(),
): Provider[] {
  return [{ provide: RecurrencesGateway, useValue: stub }];
}

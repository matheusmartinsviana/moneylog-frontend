import type { EntryLens } from '~/modules/transactions/core/types/entry';
import {
  PAYMENT_METHODS,
  TRANSACTION_SOURCES,
  TRANSACTION_TYPES,
} from '~/modules/transactions/core/types/transaction-enums';
import type {
  PaymentMethod,
  TransactionSource,
  TransactionStatus,
  TransactionType,
} from '~/modules/transactions/core/types/transaction-enums';
import { cleanSearchTerm } from '~/util/search-term';
import { DEFAULT_VIEW, VIEW_MODES, type ViewMode } from '~/util/view-mode';

export type ListView = 'records' | 'entries';

export const SEARCH_MAX_LENGTH = 100;

export interface ListFilters {
  readonly view: ListView;
  readonly from: string | null;
  readonly to: string | null;
  readonly competence: string;
  readonly lens: EntryLens;
  readonly amounts: ViewMode;
  readonly type: TransactionType | null;
  readonly accountId: string | null;
  readonly categoryId: string | null;
  readonly method: PaymentMethod | null;
  readonly status: TransactionStatus;
  readonly source: TransactionSource | null;
  readonly q: string;
}

const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function monthBounds(date: string): { readonly from: string; readonly to: string } {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prefix = date.slice(0, 7);
  return { from: `${prefix}-01`, to: `${prefix}-${String(lastDay).padStart(2, '0')}` };
}

export function firstDayMonthsBefore(date: string, months: number): string {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7)) - 1 - months;
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
}

export function defaultFilters(today: string): ListFilters {
  const { from, to } = monthBounds(today);
  return {
    view: 'records',
    from,
    to,
    competence: today.slice(0, 7),
    lens: 'CONSUMPTION',
    amounts: DEFAULT_VIEW,
    type: null,
    accountId: null,
    categoryId: null,
    method: null,
    status: 'ACTIVE',
    source: null,
    q: '',
  };
}

export function filtersToQuery(filters: ListFilters, today: string): Record<string, string> {
  const base = defaultFilters(today);
  const query: Record<string, string> = {};
  if (filters.view !== base.view) query['view'] = filters.view;
  if (filters.from !== base.from) query['from'] = filters.from ?? '';
  if (filters.to !== base.to) query['to'] = filters.to ?? '';
  if (filters.competence !== base.competence) query['competence'] = filters.competence;
  if (filters.lens !== base.lens) query['lens'] = filters.lens;
  if (filters.amounts !== base.amounts) query['amounts'] = filters.amounts;
  if (filters.type) query['type'] = filters.type;
  if (filters.accountId) query['accountId'] = filters.accountId;
  if (filters.categoryId) query['categoryId'] = filters.categoryId;
  if (filters.method) query['method'] = filters.method;
  if (filters.status !== base.status) query['status'] = filters.status;
  if (filters.source) query['source'] = filters.source;
  if (filters.q.trim() !== '') query['q'] = filters.q;
  return query;
}

export function filtersFromQuery(read: (key: string) => string | null, today: string): ListFilters {
  const base = defaultFilters(today);
  const date = (key: string, fallback: string | null): string | null => {
    const value = read(key);
    if (value === '') return null;
    return value !== null && ISO_DATE.test(value) ? value : fallback;
  };
  const oneOf = <T extends string>(key: string, allowed: readonly T[]): T | null => {
    const value = read(key);
    return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
  };
  const uuid = (key: string): string | null => {
    const value = read(key);
    return value !== null && UUID.test(value) ? value : null;
  };
  const competence = read('competence');
  return {
    view: oneOf('view', ['records', 'entries'] as const) ?? base.view,
    from: date('from', base.from),
    to: date('to', base.to),
    competence: competence !== null && ISO_MONTH.test(competence) ? competence : base.competence,
    lens: oneOf('lens', ['CONSUMPTION', 'INCOME'] as const) ?? base.lens,
    amounts: oneOf('amounts', VIEW_MODES) ?? base.amounts,
    type: oneOf('type', TRANSACTION_TYPES),
    accountId: uuid('accountId'),
    categoryId: uuid('categoryId'),
    method: oneOf('method', PAYMENT_METHODS),
    status: oneOf('status', ['ACTIVE', 'VOIDED'] as const) ?? base.status,
    source: oneOf('source', TRANSACTION_SOURCES),
    q: cleanSearchTerm(read('q') ?? ''),
  };
}

export function filtersEqual(a: ListFilters, b: ListFilters, today: string): boolean {
  return JSON.stringify(filtersToQuery(a, today)) === JSON.stringify(filtersToQuery(b, today));
}

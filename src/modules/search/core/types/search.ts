import type { Money } from '~/util/money';

export const SEARCH_GROUPS = ['transactions', 'accounts', 'categories', 'cards', 'notes'] as const;
export type SearchGroup = (typeof SEARCH_GROUPS)[number];

export interface SearchRef {
  readonly id: string;
  readonly name: string;
}

export interface SearchTransaction {
  readonly id: string;
  readonly description: string;
  readonly date: string;
  readonly amount: Money;
  readonly type: string;
  readonly category: SearchRef | null;
  readonly account: SearchRef | null;
}

export interface SearchAccount {
  readonly id: string;
  readonly name: string;
  readonly institution: string | null;
  readonly type: string;
  readonly status: string;
}

export interface SearchCategory {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly archived: boolean;
}

export interface SearchCard {
  readonly id: string;
  readonly name: string;
  readonly institution: string | null;
  readonly status: string;
}

export interface SearchNote {
  readonly id: string;
  readonly title: string;
  readonly path: string;
  readonly snippet: string;
}

export interface SearchResults {
  readonly q: string;
  readonly transactions: readonly SearchTransaction[];
  readonly accounts: readonly SearchAccount[];
  readonly categories: readonly SearchCategory[];
  readonly cards: readonly SearchCard[];
  readonly notes: readonly SearchNote[];
  readonly truncated: readonly SearchGroup[];
}

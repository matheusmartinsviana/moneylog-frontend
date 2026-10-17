import { Observable } from 'rxjs';

import type { DebtEntry, Entry, EntryTotals } from '~/modules/transactions/core/types/entry';
import type { ListFilters } from '~/modules/transactions/core/types/list-filters';
import type { Transaction, TransactionTotals } from '~/modules/transactions/core/types/transaction';
import type { TransactionInput } from '~/modules/transactions/core/types/transaction-input';
import type { Slice } from '~/util/api/slice';
import type { SplitInput } from '~/util/split';

export type TransactionSlice = Slice<Transaction> & { readonly totals: TransactionTotals };
export type EntrySlice = Slice<Entry> & {
  readonly totals: EntryTotals;
  readonly debtItems?: readonly DebtEntry[];
};

export abstract class TransactionsGateway {
  abstract list(filters: ListFilters, page: number, pageSize: number): Observable<TransactionSlice>;

  abstract listEntries(
    filters: ListFilters,
    page: number,
    pageSize: number,
  ): Observable<EntrySlice>;

  abstract get(id: string): Observable<Transaction>;

  abstract create(input: TransactionInput, idempotencyKey: string): Observable<Transaction>;

  abstract update(id: string, input: TransactionInput, version: number): Observable<Transaction>;

  abstract updateShares(id: string, split: SplitInput, version: number): Observable<Transaction>;

  abstract void(id: string, reason: string): Observable<Transaction>;

  abstract cancelInstallments(id: string, reason: string): Observable<Transaction>;
}

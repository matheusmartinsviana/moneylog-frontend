import type { Transaction } from '~/modules/transactions/core/types/transaction';
import { counterpartyName } from '~/util/debt-name';

export type LabelledTransaction = Pick<Transaction, 'description' | 'type'> &
  Partial<Pick<Transaction, 'category' | 'account' | 'card' | 'debt'>>;

export function transactionLabel(
  tx: LabelledTransaction,
  typeNames: Readonly<Record<string, string>>,
): string {
  const own = (tx.description ?? '').trim();
  if (own !== '') return own;
  const debtName = tx.debt ? counterpartyName(tx.debt) : '';
  return (
    tx.category?.name ??
    (debtName !== '' ? debtName : undefined) ??
    tx.account?.name ??
    tx.card?.name ??
    typeNames[tx.type] ??
    ''
  );
}

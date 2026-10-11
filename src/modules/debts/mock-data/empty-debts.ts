import type { DebtSliceResponse } from '~/modules/debts/infra/responses/debt.response';

export const EMPTY_DEBTS: DebtSliceResponse = { items: [], hasNext: false };

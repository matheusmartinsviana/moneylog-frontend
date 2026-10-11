import type { AccountSliceResponse } from '~/modules/accounts/infra/responses/account.response';

export const EMPTY_ACCOUNTS: AccountSliceResponse = { items: [], hasNext: false };

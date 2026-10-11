import { Observable } from 'rxjs';

import type { Account, AccountStatus } from '~/modules/accounts/core/types/account';
import type { AccountInput, AccountUpdate } from '~/modules/accounts/core/types/account-input';
import type { Slice } from '~/util/api/slice';

export interface AccountsQuery {
  readonly status?: AccountStatus;
  readonly page: number;
  readonly pageSize: number;
}

export abstract class AccountsGateway {
  abstract list(query: AccountsQuery): Observable<Slice<Account>>;
  abstract get(id: string): Observable<Account>;
  abstract create(input: AccountInput): Observable<Account>;
  abstract update(id: string, input: AccountUpdate): Observable<Account>;
  abstract archive(id: string): Observable<Account>;
  abstract unarchive(id: string): Observable<Account>;
}

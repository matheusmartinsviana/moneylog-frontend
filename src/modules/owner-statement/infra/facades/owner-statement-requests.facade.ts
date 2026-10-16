import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { OwnerStatementGateway } from '~/modules/owner-statement/core/interfaces/owner-statement.gateway';
import type {
  OwnerStatement,
  OwnerStatementQuery,
} from '~/modules/owner-statement/core/types/owner-statement';
import { OWNER_STATEMENT_ENDPOINTS } from '~/modules/owner-statement/infra/endpoints';
import { toOwnerStatement } from '~/modules/owner-statement/infra/facades/owner-statement-response.mapper';
import type { OwnerStatementResponse } from '~/modules/owner-statement/infra/responses/owner-statement.response';
import { emptyOwnerStatement } from '~/modules/owner-statement/mock-data/empty-owner-statement';
import { ProblemError, toProblem } from '~/util/api/problem';
import { API_MOCKS, mockResponse } from '~/util/api-mocks';

@Injectable({ providedIn: 'root' })
export class OwnerStatementRequestsFacade extends OwnerStatementGateway {
  private readonly http = inject(HttpClient);
  private readonly useMocks = inject(API_MOCKS);

  get(query: OwnerStatementQuery): Observable<OwnerStatement> {
    if (this.useMocks) {
      return of(
        toOwnerStatement(
          mockResponse(
            OWNER_STATEMENT_ENDPOINTS.statement,
            emptyOwnerStatement(query.from, query.months),
          ),
        ),
      );
    }
    let params = new HttpParams().set('months', query.months);
    if (query.from !== null) params = params.set('from', query.from);
    return this.http
      .get<OwnerStatementResponse>(OWNER_STATEMENT_ENDPOINTS.statement, { params })
      .pipe(
        map(toOwnerStatement),
        catchError((error: unknown) => throwError(() => new ProblemError(toProblem(error)))),
      );
  }
}

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { PurchaseGroupsGateway } from '~/modules/purchase-groups/core/interfaces/purchase-groups.gateway';
import type {
  PurchaseCommitments,
  PurchaseGroup,
  PurchaseGroupInput,
  PurchaseGroupStatus,
  PurchaseGroupUpdate,
} from '~/modules/purchase-groups/core/types/purchase-group';
import {
  IDEMPOTENCY_HEADER,
  PURCHASE_GROUPS_ENDPOINTS,
} from '~/modules/purchase-groups/infra/endpoints';
import {
  toCreateRequest,
  toPurchaseCommitments,
  toPurchaseGroup,
  toUpdateRequest,
} from '~/modules/purchase-groups/infra/facades/purchase-groups-response.mapper';
import type {
  PurchaseCommitmentsResponse,
  PurchaseGroupMemberRequest,
  PurchaseGroupResponse,
  PurchaseGroupSliceResponse,
} from '~/modules/purchase-groups/infra/responses/purchase-group.response';
import {
  emptyCommitments,
  EMPTY_PURCHASE_GROUPS,
} from '~/modules/purchase-groups/mock-data/empty-purchase-groups';
import { Problem, ProblemError, toProblem } from '~/util/api/problem';
import type { Slice } from '~/util/api/slice';
import { API_MOCKS } from '~/util/api-mocks';

function fail(error: unknown): Observable<never> {
  return throwError(() => new ProblemError(toProblem(error)));
}

function notFound(): Observable<never> {
  const problem: Problem = {
    status: 404,
    code: 'PURCHASE_GROUP_NOT_FOUND',
    fieldErrors: [],
    traceId: null,
    retryAfterSeconds: null,
  };
  return throwError(() => new ProblemError(problem));
}

@Injectable({ providedIn: 'root' })
export class PurchaseGroupsRequestsFacade extends PurchaseGroupsGateway {
  private readonly http = inject(HttpClient);
  private readonly useMocks = inject(API_MOCKS);

  list(
    status: PurchaseGroupStatus,
    page: number,
    pageSize: number,
  ): Observable<Slice<PurchaseGroup>> {
    if (this.useMocks) return of(this.toSlice(EMPTY_PURCHASE_GROUPS));
    const params = new HttpParams()
      .set('status', status)
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http
      .get<PurchaseGroupSliceResponse>(PURCHASE_GROUPS_ENDPOINTS.collection, { params })
      .pipe(
        map((slice) => this.toSlice(slice)),
        catchError(fail),
      );
  }

  create(input: PurchaseGroupInput, idempotencyKey: string): Observable<PurchaseGroup> {
    if (this.useMocks) return notFound();
    return this.http
      .post<PurchaseGroupResponse>(PURCHASE_GROUPS_ENDPOINTS.collection, toCreateRequest(input), {
        headers: new HttpHeaders().set(IDEMPOTENCY_HEADER, idempotencyKey),
      })
      .pipe(map(toPurchaseGroup), catchError(fail));
  }

  update(id: string, input: PurchaseGroupUpdate): Observable<PurchaseGroup> {
    if (this.useMocks) return notFound();
    return this.http
      .put<PurchaseGroupResponse>(PURCHASE_GROUPS_ENDPOINTS.item(id), toUpdateRequest(input))
      .pipe(map(toPurchaseGroup), catchError(fail));
  }

  addMember(id: string, transactionId: string): Observable<PurchaseGroup> {
    if (this.useMocks) return notFound();
    const body: PurchaseGroupMemberRequest = { transactionId };
    return this.http
      .post<PurchaseGroupResponse>(PURCHASE_GROUPS_ENDPOINTS.members(id), body)
      .pipe(map(toPurchaseGroup), catchError(fail));
  }

  removeMember(id: string, transactionId: string): Observable<PurchaseGroup> {
    if (this.useMocks) return notFound();
    return this.http
      .delete<PurchaseGroupResponse>(PURCHASE_GROUPS_ENDPOINTS.member(id, transactionId))
      .pipe(map(toPurchaseGroup), catchError(fail));
  }

  commitments(until: string): Observable<PurchaseCommitments> {
    if (this.useMocks) return of(toPurchaseCommitments(emptyCommitments(until)));
    const params = new HttpParams().set('until', until);
    return this.http
      .get<PurchaseCommitmentsResponse>(PURCHASE_GROUPS_ENDPOINTS.commitments, { params })
      .pipe(map(toPurchaseCommitments), catchError(fail));
  }

  private toSlice(slice: PurchaseGroupSliceResponse): Slice<PurchaseGroup> {
    return { items: slice.items.map(toPurchaseGroup), hasNext: slice.hasNext };
  }
}

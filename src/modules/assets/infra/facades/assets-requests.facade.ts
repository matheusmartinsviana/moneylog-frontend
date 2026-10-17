import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { AssetsGateway } from '~/modules/assets/core/interfaces/assets.gateway';
import type {
  Asset,
  AssetBalanceInput,
  AssetInput,
  AssetStatus,
  AssetUpdate,
} from '~/modules/assets/core/types/asset';
import { ASSETS_ENDPOINTS, IDEMPOTENCY_HEADER } from '~/modules/assets/infra/endpoints';
import {
  toAsset,
  toCreateRequest,
  toUpdateRequest,
} from '~/modules/assets/infra/facades/assets-response.mapper';
import type {
  AssetBalanceRequest,
  AssetResponse,
  AssetSliceResponse,
} from '~/modules/assets/infra/responses/asset.response';
import { EMPTY_ASSETS } from '~/modules/assets/mock-data/empty-assets';
import { Problem, ProblemError, toProblem } from '~/util/api/problem';
import type { Slice } from '~/util/api/slice';
import { API_MOCKS } from '~/util/api-mocks';

function fail(error: unknown): Observable<never> {
  return throwError(() => new ProblemError(toProblem(error)));
}

function notFound(): Observable<never> {
  const problem: Problem = {
    status: 404,
    code: 'ASSET_NOT_FOUND',
    fieldErrors: [],
    traceId: null,
    retryAfterSeconds: null,
  };
  return throwError(() => new ProblemError(problem));
}

@Injectable({ providedIn: 'root' })
export class AssetsRequestsFacade extends AssetsGateway {
  private readonly http = inject(HttpClient);
  private readonly useMocks = inject(API_MOCKS);

  list(status: AssetStatus, page: number, pageSize: number): Observable<Slice<Asset>> {
    if (this.useMocks) return of(this.toSlice(EMPTY_ASSETS));
    const params = new HttpParams()
      .set('status', status)
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http.get<AssetSliceResponse>(ASSETS_ENDPOINTS.collection, { params }).pipe(
      map((slice) => this.toSlice(slice)),
      catchError(fail),
    );
  }

  get(id: string): Observable<Asset> {
    if (this.useMocks) return notFound();
    return this.http
      .get<AssetResponse>(ASSETS_ENDPOINTS.item(id))
      .pipe(map(toAsset), catchError(fail));
  }

  create(input: AssetInput, idempotencyKey: string): Observable<Asset> {
    if (this.useMocks) return notFound();
    return this.http
      .post<AssetResponse>(ASSETS_ENDPOINTS.collection, toCreateRequest(input), {
        headers: new HttpHeaders().set(IDEMPOTENCY_HEADER, idempotencyKey),
      })
      .pipe(map(toAsset), catchError(fail));
  }

  update(id: string, input: AssetUpdate): Observable<Asset> {
    if (this.useMocks) return notFound();
    return this.http
      .put<AssetResponse>(ASSETS_ENDPOINTS.item(id), toUpdateRequest(input))
      .pipe(map(toAsset), catchError(fail));
  }

  archive(id: string): Observable<Asset> {
    if (this.useMocks) return notFound();
    return this.http
      .delete<AssetResponse>(ASSETS_ENDPOINTS.item(id))
      .pipe(map(toAsset), catchError(fail));
  }

  updateBalance(id: string, input: AssetBalanceInput): Observable<Asset> {
    if (this.useMocks) return notFound();
    const body: AssetBalanceRequest = { balance: input.balance, date: input.date };
    return this.http
      .post<AssetResponse>(ASSETS_ENDPOINTS.balance(id), body)
      .pipe(map(toAsset), catchError(fail));
  }

  private toSlice(slice: AssetSliceResponse): Slice<Asset> {
    return { items: slice.items.map(toAsset), hasNext: slice.hasNext };
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';

import { QuickEntryTokensGateway } from '~/modules/quick-entry/core/interfaces/quick-entry-tokens.gateway';
import type {
  QuickEntryToken,
  QuickEntryTokenCreation,
  QuickEntryTokenInput,
} from '~/modules/quick-entry/core/types/quick-entry-token';
import { QUICK_ENTRY_ENDPOINTS } from '~/modules/quick-entry/infra/endpoints';
import {
  toCreateRequest,
  toQuickEntryCreation,
  toQuickEntryToken,
} from '~/modules/quick-entry/infra/facades/quick-entry-response.mapper';
import type {
  QuickEntryTokenCreatedResponse,
  QuickEntryTokenRenameRequest,
  QuickEntryTokenResponse,
} from '~/modules/quick-entry/infra/responses/quick-entry-token.response';
import {
  MOCK_QUICK_ENTRY_TOKENS,
  mockQuickEntryCreation,
} from '~/modules/quick-entry/mock-data/mock-quick-entry-tokens';
import { API_MOCKS } from '~/util/api-mocks';

@Injectable({ providedIn: 'root' })
export class QuickEntryRequestsFacade extends QuickEntryTokensGateway {
  private readonly http = inject(HttpClient);
  private readonly useMocks = inject(API_MOCKS);

  list(): Observable<readonly QuickEntryToken[]> {
    if (this.useMocks) return of(MOCK_QUICK_ENTRY_TOKENS);
    return this.http
      .get<QuickEntryTokenResponse[]>(QUICK_ENTRY_ENDPOINTS.collection)
      .pipe(map((items) => items.map(toQuickEntryToken)));
  }

  create(input: QuickEntryTokenInput): Observable<QuickEntryTokenCreation> {
    if (this.useMocks) return of(mockQuickEntryCreation(input.label.trim()));
    return this.http
      .post<QuickEntryTokenCreatedResponse>(
        QUICK_ENTRY_ENDPOINTS.collection,
        toCreateRequest(input),
      )
      .pipe(map(toQuickEntryCreation));
  }

  rename(id: string, label: string): Observable<QuickEntryToken> {
    if (this.useMocks) return of({ ...MOCK_QUICK_ENTRY_TOKENS[0]!, id, label: label.trim() });
    const body: QuickEntryTokenRenameRequest = { label: label.trim() };
    return this.http
      .put<QuickEntryTokenResponse>(QUICK_ENTRY_ENDPOINTS.item(id), body)
      .pipe(map(toQuickEntryToken));
  }

  revoke(id: string): Observable<QuickEntryToken> {
    if (this.useMocks) {
      return of({
        ...MOCK_QUICK_ENTRY_TOKENS[0]!,
        id,
        status: 'REVOKED',
        revokedAt: '2026-10-21T13:00:00Z',
        revokedReason: 'USER',
      });
    }
    return this.http
      .post<QuickEntryTokenResponse>(QUICK_ENTRY_ENDPOINTS.revoke(id), null)
      .pipe(map(toQuickEntryToken));
  }
}

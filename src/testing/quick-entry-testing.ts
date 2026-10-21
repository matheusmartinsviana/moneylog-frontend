import { Provider } from '@angular/core';
import { Observable, of } from 'rxjs';

import { QuickEntryTokensGateway } from '~/modules/quick-entry/core/interfaces/quick-entry-tokens.gateway';
import type {
  QuickEntryToken,
  QuickEntryTokenCreation,
  QuickEntryTokenInput,
} from '~/modules/quick-entry/core/types/quick-entry-token';

export const TEST_SECRET = 'mlq_TESTE001_SEGREDO-DE-TESTE-NAO-USAR-EM-LUGAR-NENHUM-00000';

export function aQuickToken(overrides: Partial<QuickEntryToken> = {}): QuickEntryToken {
  return {
    id: 'tok-1',
    label: 'iPhone do Matheus',
    prefix: 'TESTE001',
    accountId: 'acc-1',
    accountName: 'Carteira',
    status: 'ACTIVE',
    expiresAt: '2026-11-20T12:00:00Z',
    createdAt: '2026-10-21T12:00:00Z',
    lastUsedAt: null,
    lastUsedIp: null,
    lastUsedUserAgent: null,
    revokedAt: null,
    revokedReason: null,
    ...overrides,
  };
}

export class QuickEntryGatewayStub extends QuickEntryTokensGateway {
  tokens: QuickEntryToken[] = [];
  readonly calls: string[] = [];
  readonly created: QuickEntryTokenInput[] = [];
  listResult: Observable<readonly QuickEntryToken[]> | null = null;
  createResult: Observable<QuickEntryTokenCreation> | null = null;
  next: Observable<QuickEntryToken> | null = null;

  list(): Observable<readonly QuickEntryToken[]> {
    this.calls.push('list');
    return this.listResult ?? of(this.tokens);
  }

  create(input: QuickEntryTokenInput): Observable<QuickEntryTokenCreation> {
    this.calls.push('create');
    this.created.push(input);
    return (
      this.createResult ??
      of({
        token: aQuickToken({
          id: 'tok-new',
          label: input.label,
          accountId: input.accountId,
          createdAt: '2026-10-21T13:00:00Z',
        }),
        secret: TEST_SECRET,
      })
    );
  }

  rename(id: string, label: string): Observable<QuickEntryToken> {
    this.calls.push(`rename:${id}`);
    return this.next ?? of(aQuickToken({ id, label }));
  }

  revoke(id: string): Observable<QuickEntryToken> {
    this.calls.push(`revoke:${id}`);
    return (
      this.next ??
      of(
        aQuickToken({
          id,
          status: 'REVOKED',
          revokedAt: '2026-10-21T14:00:00Z',
          revokedReason: 'USER',
        }),
      )
    );
  }
}

export function provideQuickEntryStub(
  stub: QuickEntryGatewayStub = new QuickEntryGatewayStub(),
): Provider[] {
  return [{ provide: QuickEntryTokensGateway, useValue: stub }];
}

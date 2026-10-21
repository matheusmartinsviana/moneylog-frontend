import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { QuickEntryTokensGateway } from '~/modules/quick-entry/core/interfaces/quick-entry-tokens.gateway';
import { QUICK_ENTRY_ENDPOINTS } from '~/modules/quick-entry/infra/endpoints';
import { QuickEntryRequestsFacade } from '~/modules/quick-entry/infra/facades/quick-entry-requests.facade';
import { provideQuickEntry } from '~/modules/quick-entry/infra/quick-entry.providers';
import { TEST_SECRET } from '~/testing/quick-entry-testing';
import { API_MOCKS } from '~/util/api-mocks';

function setup(useMocks: boolean) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_MOCKS, useValue: useMocks },
      provideQuickEntry(),
    ],
  });
  return {
    gateway: TestBed.inject(QuickEntryTokensGateway),
    http: TestBed.inject(HttpTestingController),
  };
}

const tokenBody = {
  id: 'tok-1',
  label: 'iPhone',
  prefix: 'TESTE001',
  scope: 'QUICK_ENTRY',
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
};

describe('Requisições do token de lançamento rápido', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('Dado o bootstrap, então a porta é a facade de requisições', () => {
    setup(true);
    expect(TestBed.inject(QuickEntryTokensGateway)).toBe(TestBed.inject(QuickEntryRequestsFacade));
  });

  it('Dado o mock (dado fictício marcado como exemplo), então não sai requisição', async () => {
    const { gateway, http } = setup(true);

    const list = await firstValueFrom(gateway.list());
    const created = await firstValueFrom(
      gateway.create({ label: ' Novo ', accountId: 'a', expiresInDays: 30 }),
    );

    expect(list).toHaveLength(1);
    expect(created.token.label).toBe('Novo');
    expect(created.secret).toContain('EXEMPLO-FICTICIO');
    http.expectNone(() => true);
  });

  it('Dado a lista, então faz GET e não expõe campo de segredo', async () => {
    const { gateway, http } = setup(false);

    const result = firstValueFrom(gateway.list());
    const request = http.expectOne(QUICK_ENTRY_ENDPOINTS.collection);
    expect(request.request.method).toBe('GET');
    request.flush([tokenBody]);

    expect((await result)[0]).toMatchObject({ id: 'tok-1', accountName: 'Carteira' });
  });

  it('Dado gerar, então faz POST com rótulo aparado, conta e validade, e separa o segredo do recurso', async () => {
    const { gateway, http } = setup(false);

    const result = firstValueFrom(
      gateway.create({ label: '  iPhone ', accountId: 'acc-1', expiresInDays: 30 }),
    );
    const request = http.expectOne(QUICK_ENTRY_ENDPOINTS.collection);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      label: 'iPhone',
      accountId: 'acc-1',
      expiresInDays: 30,
    });
    request.flush({ ...tokenBody, token: TEST_SECRET });

    const creation = await result;
    expect(creation.secret).toBe(TEST_SECRET);
    expect(JSON.stringify(creation.token)).not.toContain(TEST_SECRET);
    expect(Object.keys(creation.token)).not.toContain('token');
    expect(Object.keys(creation.token)).not.toContain('scope');
  });

  it('Dado renomear, então faz PUT só com o rótulo', async () => {
    const { gateway, http } = setup(false);

    const result = firstValueFrom(gateway.rename('tok-1', ' iPad '));
    const request = http.expectOne(QUICK_ENTRY_ENDPOINTS.item('tok-1'));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ label: 'iPad' });
    request.flush({ ...tokenBody, label: 'iPad' });

    expect((await result).label).toBe('iPad');
  });

  it('Dado revogar, então faz POST sem corpo em /revoke', async () => {
    const { gateway, http } = setup(false);

    const result = firstValueFrom(gateway.revoke('tok-1'));
    const request = http.expectOne(QUICK_ENTRY_ENDPOINTS.revoke('tok-1'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush({
      ...tokenBody,
      status: 'REVOKED',
      revokedAt: '2026-10-21T14:00:00Z',
      revokedReason: 'USER',
    });

    expect(await result).toMatchObject({ status: 'REVOKED', revokedReason: 'USER' });
  });
});

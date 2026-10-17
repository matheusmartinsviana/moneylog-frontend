import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { DebtsGateway } from '~/modules/debts/core/interfaces/debts.gateway';
import { provideDebts } from '~/modules/debts/infra/debts.providers';
import { DEBTS_ENDPOINTS } from '~/modules/debts/infra/endpoints';
import { DebtsRequestsFacade } from '~/modules/debts/infra/facades/debts-requests.facade';
import { aDebtResponse, brl } from '~/testing/etapa4-response-testing';
import { API_MOCKS } from '~/util/api-mocks';

function setup(useMocks: boolean) {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_MOCKS, useValue: useMocks },
      provideDebts(),
    ],
  });
  return { gateway: TestBed.inject(DebtsGateway), http: TestBed.inject(HttpTestingController) };
}

describe('DebtsRequestsFacade', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('Dado o bootstrap, então a porta DebtsGateway é a facade de requisições', () => {
    const { gateway } = setup(true);
    expect(gateway).toBe(TestBed.inject(DebtsRequestsFacade));
  });

  it('Dado o mock, então a lista vem vazia e dívida por id e ações dão 404 sem requisição', async () => {
    const { gateway, http } = setup(true);

    expect(await firstValueFrom(gateway.list({ page: 1, pageSize: 10 }))).toEqual({
      items: [],
      hasNext: false,
    });
    await expect(firstValueFrom(gateway.get('x'))).rejects.toMatchObject({
      problem: { status: 404, code: 'DEBT_NOT_FOUND' },
    });
    await expect(firstValueFrom(gateway.cancel('x', 'perdoei'))).rejects.toMatchObject({
      problem: { code: 'DEBT_NOT_FOUND' },
    });
    http.expectNone(() => true);
  });

  describe('em modo real', () => {
    it('Dado filtros, então a lista pede direção, status, pessoa, atrasadas, página e tamanho', async () => {
      const { gateway, http } = setup(false);

      const result = firstValueFrom(
        gateway.list({
          direction: 'RECEIVABLE',
          status: 'OPEN',
          personId: 'person-1',
          overdue: true,
          page: 1,
          pageSize: 50,
        }),
      );
      const req = http.expectOne((r) => r.url === DEBTS_ENDPOINTS.collection);
      expect(req.request.params.get('direction')).toBe('RECEIVABLE');
      expect(req.request.params.get('status')).toBe('OPEN');
      expect(req.request.params.get('personId')).toBe('person-1');
      expect(req.request.params.get('overdue')).toBe('true');
      req.flush({ items: [aDebtResponse()], hasNext: false });

      const slice = await result;
      expect(slice.items[0]).toMatchObject({ status: 'PARTIALLY_SETTLED', cancelable: true });
      expect(slice.items[0]?.outstanding.amount).toBe('200.00');
    });

    it('Dado a dívida, então mapeia quitações, categoria e voidBlockedBy', async () => {
      const { gateway, http } = setup(false);

      const result = firstValueFrom(gateway.get('debt-1'));
      http.expectOne(DEBTS_ENDPOINTS.item('debt-1')).flush(
        aDebtResponse({
          settlements: [
            { transactionId: 't1', amount: brl('100.00'), date: '2026-10-06', active: false },
          ],
          category: { id: 'c1', name: 'Alimentação' },
          voidBlockedBy: 'DEBT_HAS_SETTLEMENTS',
        }),
      );

      const debt = await result;
      expect(debt.settlements[0]).toMatchObject({ transactionId: 't1', active: false });
      expect(debt.category).toEqual({ id: 'c1', name: 'Alimentação' });
      expect(debt.voidBlockedBy).toBe('DEBT_HAS_SETTLEMENTS');
    });

    it('Dado criar, então o corpo leva categoryId só em PAYABLE (S-137) e a descrição sem espaços', async () => {
      const { gateway, http } = setup(false);
      const base = {
        personId: 'person-1',
        principal: '80.00',
        date: '2026-10-05',
        expectedDate: null,
        description: ' Jantar ',
        categoryId: 'cat-1',
      };

      const payable = firstValueFrom(gateway.create({ ...base, direction: 'PAYABLE' }, 'key-1'));
      const post = http.expectOne(DEBTS_ENDPOINTS.collection);
      expect(post.request.method).toBe('POST');
      expect(post.request.headers.get('Idempotency-Key')).toBe('key-1');
      expect(post.request.body).toEqual({
        personId: 'person-1',
        direction: 'PAYABLE',
        principal: '80.00',
        date: '2026-10-05',
        expectedDate: null,
        description: 'Jantar',
        categoryId: 'cat-1',
      });
      post.flush(aDebtResponse({ direction: 'PAYABLE' }));
      await payable;

      const receivable = firstValueFrom(
        gateway.create({ ...base, direction: 'RECEIVABLE' }, 'key-2'),
      );
      const second = http.expectOne(DEBTS_ENDPOINTS.collection);
      expect(second.request.body).not.toHaveProperty('categoryId');
      second.flush(aDebtResponse());
      await receivable;
    });

    it('Dado editar, então PUT com descrição, previsão e version', async () => {
      const { gateway, http } = setup(false);

      const result = firstValueFrom(
        gateway.update('debt-1', { description: 'Novo', expectedDate: '2026-11-01', version: 2 }),
      );
      const req = http.expectOne(DEBTS_ENDPOINTS.item('debt-1'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        description: 'Novo',
        expectedDate: '2026-11-01',
        version: 2,
      });
      req.flush(aDebtResponse({ version: 3 }));
      expect((await result).version).toBe(3);
    });

    it('Dado perdoar e estornar o registro, então POST com o motivo', async () => {
      const { gateway, http } = setup(false);

      const canceled = firstValueFrom(gateway.cancel('debt-1', ' combinado '));
      const cancel = http.expectOne(DEBTS_ENDPOINTS.cancel('debt-1'));
      expect(cancel.request.method).toBe('POST');
      expect(cancel.request.body).toEqual({ reason: 'combinado' });
      cancel.flush(aDebtResponse({ status: 'CANCELED' }));
      expect((await canceled).status).toBe('CANCELED');

      const voided = firstValueFrom(gateway.void('debt-1', 'engano'));
      const voidReq = http.expectOne(DEBTS_ENDPOINTS.void('debt-1'));
      expect(voidReq.request.body).toEqual({ reason: 'engano' });
      voidReq.flush(aDebtResponse({ status: 'VOIDED' }));
      expect((await voided).status).toBe('VOIDED');
    });

    it.each(['DEBT_HAS_SETTLEMENTS', 'DEBT_CLOSED', 'DEBT_REASON_REQUIRED'])(
      'Dado 422 %s, então a falha chega tipada com o code',
      async (code) => {
        const { gateway, http } = setup(false);

        const result = firstValueFrom(gateway.void('debt-1', 'x'));
        http
          .expectOne(DEBTS_ENDPOINTS.void('debt-1'))
          .flush({ code, errors: [] }, { status: 422, statusText: 'Unprocessable Entity' });

        await expect(result).rejects.toMatchObject({ problem: { status: 422, code } });
      },
    );
  });

  describe('credor livre (2.13.0)', () => {
    it('Dado dívida com credor livre, então o POST leva creditorName e não leva personId nem categoria', async () => {
      const { gateway, http } = setup(false);

      const result = firstValueFrom(
        gateway.create(
          {
            personId: null,
            creditorName: ' Banco Azul ',
            direction: 'PAYABLE',
            principal: '30000.00',
            date: '2026-10-07',
            expectedDate: null,
            description: '',
            categoryId: 'cat-1',
          },
          'key-1',
        ),
      );
      const req = http.expectOne(DEBTS_ENDPOINTS.collection);
      expect(req.request.body).toEqual({
        creditorName: 'Banco Azul',
        direction: 'PAYABLE',
        principal: '30000.00',
        date: '2026-10-07',
        expectedDate: null,
      });
      req.flush(aDebtResponse({ person: null, creditorName: 'Banco Azul', direction: 'PAYABLE' }));

      expect(await result).toMatchObject({ person: null, creditorName: 'Banco Azul' });
    });

    it('Dado dívida de pessoa, então o corpo continua com personId e sem creditorName', async () => {
      const { gateway, http } = setup(false);

      const result = firstValueFrom(
        gateway.create(
          {
            personId: 'person-1',
            direction: 'RECEIVABLE',
            principal: '10.00',
            date: '2026-10-07',
            expectedDate: null,
            description: '',
            categoryId: null,
          },
          'key-2',
        ),
      );
      const req = http.expectOne(DEBTS_ENDPOINTS.collection);
      expect(req.request.body).toMatchObject({ personId: 'person-1' });
      expect(req.request.body).not.toHaveProperty('creditorName');
      req.flush(aDebtResponse());
      expect((await result).person).toMatchObject({ id: 'person-1' });
    });
  });

  describe('Pix no crédito (ADR-031)', () => {
    const cashOut = {
      cardId: 'card-1',
      accountId: 'acc-1',
      beneficiaryPersonId: null,
      principal: '1000.00',
      installments: 4,
      totalWithInterest: '1120.00',
      rateBps: null,
      firstInvoiceDate: '2026-11-05',
      channel: null,
    };

    it('Dado o Pix para mim com total, então POST /v1/card-cash-outs com a chave e sem rateBps nem beneficiário', async () => {
      const { gateway, http } = setup(false);

      const result = firstValueFrom(gateway.createCardCashOut(cashOut, 'key-cash'));
      const req = http.expectOne(DEBTS_ENDPOINTS.cardCashOuts);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Idempotency-Key')).toBe('key-cash');
      expect(req.request.body).toEqual({
        cardId: 'card-1',
        accountId: 'acc-1',
        principal: '1000.00',
        installments: 4,
        totalWithInterest: '1120.00',
        firstInvoiceDate: '2026-11-05',
      });
      req.flush(
        aDebtResponse({
          kind: 'CARD_CASH_OUT',
          effectiveRate: { monthlyBps: 372, annualBps: 5430, method: 'IRR' },
        }),
      );

      expect((await result).effectiveRate).toEqual({ monthlyBps: 372, annualBps: 5430 });
    });

    it('Dado o Pix para uma pessoa com taxa, então leva o beneficiário e o rateBps, sem conta nem total', async () => {
      const { gateway, http } = setup(false);

      const result = firstValueFrom(
        gateway.createCardCashOut(
          {
            ...cashOut,
            accountId: 'acc-1',
            beneficiaryPersonId: 'person-1',
            totalWithInterest: null,
            rateBps: 250,
            channel: ' Pix ',
          },
          'key-2',
        ),
      );
      const req = http.expectOne(DEBTS_ENDPOINTS.cardCashOuts);
      expect(req.request.body).toEqual({
        cardId: 'card-1',
        beneficiaryPersonId: 'person-1',
        principal: '1000.00',
        installments: 4,
        rateBps: 250,
        firstInvoiceDate: '2026-11-05',
        channel: 'Pix',
      });
      req.flush(aDebtResponse());
      await result;
    });

    it('Dado dívida sem taxa efetiva, então o mapa devolve null', async () => {
      const { gateway, http } = setup(false);

      const result = firstValueFrom(gateway.get('debt-1'));
      http.expectOne(DEBTS_ENDPOINTS.item('debt-1')).flush(aDebtResponse());

      expect(await result).toMatchObject({
        kind: 'PERSONAL',
        effectiveRate: null,
        channel: null,
      });
    });

    it('Dado o mock, então o Pix no crédito dá 404 sem requisição', async () => {
      const { gateway, http } = setup(true);

      await expect(firstValueFrom(gateway.createCardCashOut(cashOut, 'k'))).rejects.toMatchObject({
        problem: { code: 'DEBT_NOT_FOUND' },
      });
      http.expectNone(() => true);
    });
  });
});

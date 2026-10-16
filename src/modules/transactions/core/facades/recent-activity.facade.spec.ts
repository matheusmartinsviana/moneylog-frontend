import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import {
  RECENT_ACTIVITY_SIZE,
  RecentActivityFacade,
} from '~/modules/transactions/core/facades/recent-activity.facade';
import { failWith } from '~/testing/accounts-testing';
import {
  aTransaction,
  provideTransactionsStub,
  someTotals,
  TransactionsGatewayStub,
} from '~/testing/transactions-testing';

function setup(gateway = new TransactionsGatewayStub()) {
  TestBed.configureTestingModule({
    providers: [provideTransactionsStub(gateway), RecentActivityFacade],
  });
  return { gateway, facade: TestBed.inject(RecentActivityFacade) };
}

describe('RecentActivityFacade', () => {
  it('Dado o asOf do painel, quando carrega, então pede a primeira página de 5 até asOf, sem data inicial', () => {
    const { gateway, facade } = setup();

    facade.load('2026-10-13');

    expect(gateway.listCalls).toHaveLength(1);
    expect(gateway.listCalls[0]).toMatchObject({
      page: 1,
      pageSize: RECENT_ACTIVITY_SIZE,
      filters: { from: null, to: '2026-10-13', status: 'ACTIVE' },
    });
  });

  it('Dado a resposta, então preserva a ordem da API e não calcula total', () => {
    const gateway = new TransactionsGatewayStub();
    gateway.list$ = () =>
      of({
        items: [
          aTransaction({ id: 'c', date: '2026-10-12' }),
          aTransaction({ id: 'a', date: '2026-10-13', type: 'TRANSFER' }),
          aTransaction({ id: 'b', date: '2026-10-01', status: 'VOIDED' }),
        ],
        hasNext: true,
        totals: someTotals(3),
      });
    const { facade } = setup(gateway);

    facade.load('2026-10-13');

    expect(facade.items().map((i) => i.id)).toEqual(['c', 'a', 'b']);
    expect(facade.items().map((i) => i.status)).toEqual(['ACTIVE', 'ACTIVE', 'VOIDED']);
    expect(facade.items().map((i) => i.date)).toEqual(['2026-10-12', '2026-10-13', '2026-10-01']);
    expect(Object.keys(facade.state())).not.toContain('totals');
  });

  it('Dado movimentação com data depois de asOf, então aparece com o selo de agendada', () => {
    const gateway = new TransactionsGatewayStub();
    gateway.list$ = () =>
      of({
        items: [aTransaction({ id: 'f', date: '2026-10-20' })],
        hasNext: false,
        totals: someTotals(1),
      });
    const { facade } = setup(gateway);

    facade.load('2026-10-13');

    expect(facade.items()[0]?.scheduled).toBe(true);
  });

  it('Dado nenhuma movimentação, então o estado é vazio', () => {
    const gateway = new TransactionsGatewayStub();
    gateway.list$ = () => of({ items: [], hasNext: false, totals: someTotals(0) });
    const { facade } = setup(gateway);

    facade.load('2026-10-13');

    expect(facade.empty()).toBe(true);
  });

  it('Dado falha, então só este bloco fica em erro e "tentar de novo" recarrega', () => {
    const gateway = new TransactionsGatewayStub();
    gateway.list$ = () => failWith(500, 'INTERNAL_ERROR');
    const { facade } = setup(gateway);

    facade.load('2026-10-13');
    expect(facade.error()).toMatchObject({ status: 500 });

    gateway.list$ = () => of({ items: [aTransaction()], hasNext: false, totals: someTotals(1) });
    facade.retry();

    expect(gateway.listCalls).toHaveLength(2);
    expect(facade.state().status).toBe('ready');
  });

  it('Dado retry antes de qualquer carga, então não chama a API', () => {
    const { gateway, facade } = setup();

    facade.retry();

    expect(gateway.listCalls).toHaveLength(0);
  });
});

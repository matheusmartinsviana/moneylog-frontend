import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';

import { OwnerStatementFacade } from '~/modules/owner-statement/core/facades/owner-statement.facade';
import { OwnerStatementGateway } from '~/modules/owner-statement/core/interfaces/owner-statement.gateway';
import type {
  OwnerStatement,
  OwnerStatementQuery,
} from '~/modules/owner-statement/core/types/owner-statement';
import { failWith } from '~/testing/accounts-testing';

const brl = (amount: string) => ({ amount, currency: 'BRL' });

const statement: OwnerStatement = {
  asOf: '2026-10-15',
  openingBalance: brl('1000.00'),
  months: [],
  negativeMonths: ['2026-11'],
  warnings: [],
};

class GatewayStub extends OwnerStatementGateway {
  readonly queries: OwnerStatementQuery[] = [];
  result: (query: OwnerStatementQuery) => Observable<OwnerStatement> = () => of(statement);

  get(query: OwnerStatementQuery): Observable<OwnerStatement> {
    this.queries.push(query);
    return this.result(query);
  }
}

function setup(gateway = new GatewayStub()) {
  TestBed.configureTestingModule({
    providers: [{ provide: OwnerStatementGateway, useValue: gateway }, OwnerStatementFacade],
  });
  return { gateway, facade: TestBed.inject(OwnerStatementFacade) };
}

describe('OwnerStatementFacade', () => {
  it('Dado a janela, então expõe o resumo do backend sem recalcular', () => {
    const { facade, gateway } = setup();

    facade.load({ from: '2026-11', months: 3 });

    expect(gateway.queries).toEqual([{ from: '2026-11', months: 3 }]);
    expect(facade.data()?.negativeMonths).toEqual(['2026-11']);
  });

  it('Dado carregando, então o estado é loading', () => {
    const gateway = new GatewayStub();
    gateway.result = () => new Subject<OwnerStatement>();
    const { facade } = setup(gateway);

    facade.load({ from: null, months: 3 });

    expect(facade.state().status).toBe('loading');
  });

  it('Dado falha, então o estado é erro tipado e tentar de novo recarrega', () => {
    const gateway = new GatewayStub();
    gateway.result = () => failWith(500, 'INTERNAL');
    const { facade } = setup(gateway);

    facade.load({ from: null, months: 3 });
    expect(facade.error()).toMatchObject({ status: 500 });

    gateway.result = () => of(statement);
    facade.load({ from: null, months: 3 });
    expect(facade.state().status).toBe('ready');
  });
});

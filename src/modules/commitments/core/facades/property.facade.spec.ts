import { TestBed } from '@angular/core/testing';

import { PropertyFacade } from '~/modules/commitments/core/facades/property.facade';
import { failWith } from '~/testing/accounts-testing';
import {
  aLoan,
  aProject,
  CommitmentsGatewayStub,
  provideCommitmentsStub,
} from '~/testing/commitments-testing';

function setup(stub = new CommitmentsGatewayStub()) {
  TestBed.configureTestingModule({ providers: [provideCommitmentsStub(stub), PropertyFacade] });
  return { stub, facade: TestBed.inject(PropertyFacade) };
}

describe('PropertyFacade', () => {
  it('Dado um projeto, então a tela fica pronta', () => {
    const { facade } = setup();

    facade.load('c-project');

    expect(facade.state().status).toBe('ready');
  });

  it('Dado um compromisso que não é projeto, então avisa em vez de montar a tela', () => {
    const { facade } = setup();

    facade.load('c-loan');

    expect(aLoan().kind).toBe('TRACKED_THIRD_PARTY');
    expect(facade.state().status).toBe('notProject');
  });

  it('Dado 404, então não encontrado; dado 500, então erro', () => {
    const stub = new CommitmentsGatewayStub();
    stub.get$ = failWith(404, 'COMMITMENT_NOT_FOUND');
    const { facade } = setup(stub);

    facade.load('x');
    expect(facade.state().status).toBe('notFound');

    stub.get$ = failWith(500, 'INTERNAL');
    facade.load('x');
    expect(facade.state().status).toBe('error');
  });

  it('Dado definir cotas, então envia a versão atual e usa o compromisso devolvido', () => {
    const { facade, stub } = setup();
    facade.load('c-project');
    const changes: string[] = [];
    facade.changed$.subscribe((change) => changes.push(change));

    facade.updateShares(2, {
      shares: [
        { personId: null, amount: '4000.00' },
        { personId: 'p-1', amount: '6000.00' },
      ],
      coBuyerPersonId: 'p-1',
    });

    expect(stub.shareUpdates[0]).toMatchObject({
      id: 'c-project',
      position: 2,
      input: { coBuyerPersonId: 'p-1', version: aProject().version },
    });
    expect(changes).toEqual(['shares']);
    expect(facade.commitment()?.version).toBe(aProject().version + 1);
  });

  it('Dado soma de cotas inválida, então mostra o problema do servidor', () => {
    const stub = new CommitmentsGatewayStub();
    const { facade } = setup(stub);
    facade.load('c-project');
    stub.shares$ = failWith(422, 'COMMITMENT_SHARES_INVALID');

    facade.updateShares(2, { shares: [{ personId: null, amount: '1.00' }], coBuyerPersonId: null });

    expect(facade.problem()?.code).toBe('COMMITMENT_SHARES_INVALID');
  });

  it('Dado conflito de versão, então recarrega do servidor', () => {
    const stub = new CommitmentsGatewayStub();
    const { facade } = setup(stub);
    facade.load('c-project');
    stub.clauses$ = failWith(409, 'VERSION_CONFLICT');
    let loads = 0;
    const original = stub.get.bind(stub);
    stub.get = (id: string) => {
      loads++;
      return original(id);
    };

    facade.updateClauses({
      lateFeeBps: 200,
      monthlyInterestBps: 100,
      terminationRetentionBps: 700,
      notes: null,
    });

    expect(loads).toBe(1);
  });

  it('Dado exportar CSV, então entrega o arquivo do servidor no idioma pedido', () => {
    const { facade, stub } = setup();
    facade.load('c-project');
    const files: string[] = [];
    facade.file$.subscribe((file) => files.push(file.filename));

    facade.exportCsv('en');

    expect(stub.csvRequests).toEqual([{ id: 'c-project', language: 'en' }]);
    expect(files).toEqual(['moneylog-imovel-por-pessoa.csv']);
    expect(facade.exporting()).toBe(false);
  });
});

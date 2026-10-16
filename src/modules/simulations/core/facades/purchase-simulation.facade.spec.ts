import { TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';

import { PurchaseSimulationFacade } from '~/modules/simulations/core/facades/purchase-simulation.facade';
import type { PurchaseSimulationInput } from '~/modules/simulations/core/types/simulation';
import { failWith } from '~/testing/accounts-testing';
import {
  aSimulation,
  provideSimulationsStub,
  SimulationsGatewayStub,
} from '~/testing/simulations-testing';

const input: PurchaseSimulationInput = {
  amount: '1200.00',
  installments: 6,
  interestRatePerMonthBps: 0,
  firstInstallmentMonth: '2026-11',
  cancelSubscriptionIds: ['sub-1'],
};

function setup(gateway = new SimulationsGatewayStub()) {
  TestBed.configureTestingModule({
    providers: [provideSimulationsStub(gateway), PurchaseSimulationFacade],
  });
  return { gateway, facade: TestBed.inject(PurchaseSimulationFacade) };
}

describe('PurchaseSimulationFacade', () => {
  it('Dado que ainda não simulei, então o estado é idle', () => {
    const { facade } = setup();

    expect(facade.state().status).toBe('idle');
    expect(facade.result()).toBeNull();
  });

  it('Dado uma simulação, então envia o pedido e expõe o resultado do backend sem recalcular', () => {
    const { facade, gateway } = setup();

    facade.run(input);

    expect(gateway.inputs).toEqual([input]);
    expect(facade.result()).toEqual(aSimulation());
  });

  it('Dado a resposta pendente, então fica carregando', () => {
    const { facade, gateway } = setup();
    gateway.result$ = NEVER;

    facade.run(input);

    expect(facade.loading()).toBe(true);
  });

  it('Dado 422 SIMULATION_INVALID, então expõe o problema para a tela tentar de novo', () => {
    const { facade, gateway } = setup();
    gateway.result$ = failWith(422, 'SIMULATION_INVALID');

    facade.run(input);

    expect(facade.problem()?.code).toBe('SIMULATION_INVALID');
    expect(facade.result()).toBeNull();
  });

  it('Dado limpar, então volta ao estado idle', () => {
    const { facade } = setup();
    facade.run(input);

    facade.reset();

    expect(facade.state().status).toBe('idle');
  });
});

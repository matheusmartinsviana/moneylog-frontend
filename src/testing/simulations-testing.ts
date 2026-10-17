import { Provider } from '@angular/core';
import { Observable, of } from 'rxjs';

import { SimulationsGateway } from '~/modules/simulations/core/interfaces/simulations.gateway';
import type {
  PurchaseSimulation,
  PurchaseSimulationInput,
  SimulationMonth,
} from '~/modules/simulations/core/types/simulation';

const brl = (amount: string) => ({ amount, currency: 'BRL' });

export function aSimulationMonth(overrides: Partial<SimulationMonth> = {}): SimulationMonth {
  return {
    competence: '2026-11',
    surplusBefore: brl('500.00'),
    surplusAfter: brl('300.00'),
    delta: brl('-200.00'),
    negativeAfter: false,
    cutsMonthly: null,
    surplusAfterWithCuts: null,
    negativeAfterWithCuts: null,
    estimated: false,
    ...overrides,
  };
}

export function aSimulation(overrides: Partial<PurchaseSimulation> = {}): PurchaseSimulation {
  return {
    installmentAmount: brl('200.00'),
    total: brl('1200.00'),
    months: [aSimulationMonth()],
    horizon: {
      from: '2026-11',
      to: '2026-11',
      calculatedMonths: 1,
      requiredMonths: 1,
      limited: false,
    },
    classification: 'SUSTAINABLE',
    reasons: [{ code: 'NO_NEGATIVE_MONTH', competence: null, params: {} }],
    endBalanceMin: brl('900.00'),
    endBalanceMinWithCuts: null,
    financingWarning: false,
    ...overrides,
  };
}

export class SimulationsGatewayStub extends SimulationsGateway {
  readonly inputs: PurchaseSimulationInput[] = [];
  result$: Observable<PurchaseSimulation> = of(aSimulation());

  simulatePurchase(input: PurchaseSimulationInput): Observable<PurchaseSimulation> {
    this.inputs.push(input);
    return this.result$;
  }
}

export function provideSimulationsStub(
  stub: SimulationsGatewayStub = new SimulationsGatewayStub(),
): Provider[] {
  return [{ provide: SimulationsGateway, useValue: stub }];
}

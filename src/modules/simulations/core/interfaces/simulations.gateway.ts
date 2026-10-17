import { Observable } from 'rxjs';

import type {
  PurchaseSimulation,
  PurchaseSimulationInput,
} from '~/modules/simulations/core/types/simulation';

export abstract class SimulationsGateway {
  abstract simulatePurchase(input: PurchaseSimulationInput): Observable<PurchaseSimulation>;
}

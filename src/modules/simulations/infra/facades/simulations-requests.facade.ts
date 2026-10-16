import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import { SimulationsGateway } from '~/modules/simulations/core/interfaces/simulations.gateway';
import type {
  PurchaseSimulation,
  PurchaseSimulationInput,
} from '~/modules/simulations/core/types/simulation';
import { SIMULATIONS_ENDPOINTS } from '~/modules/simulations/infra/endpoints';
import {
  toPurchaseSimulation,
  toPurchaseSimulationRequest,
} from '~/modules/simulations/infra/facades/simulation-response.mapper';
import type { PurchaseSimulationResponse } from '~/modules/simulations/infra/responses/simulation.response';
import { emptyPurchaseSimulation } from '~/modules/simulations/mock-data/empty-simulation';
import { ProblemError, toProblem } from '~/util/api/problem';
import { API_MOCKS, mockResponse } from '~/util/api-mocks';

@Injectable({ providedIn: 'root' })
export class SimulationsRequestsFacade extends SimulationsGateway {
  private readonly http = inject(HttpClient);
  private readonly useMocks = inject(API_MOCKS);

  simulatePurchase(input: PurchaseSimulationInput): Observable<PurchaseSimulation> {
    if (this.useMocks) {
      return of(
        toPurchaseSimulation(
          mockResponse(SIMULATIONS_ENDPOINTS.purchase, emptyPurchaseSimulation(input)),
        ),
      );
    }
    return this.http
      .post<PurchaseSimulationResponse>(
        SIMULATIONS_ENDPOINTS.purchase,
        toPurchaseSimulationRequest(input),
      )
      .pipe(
        map(toPurchaseSimulation),
        catchError((error: unknown) => throwError(() => new ProblemError(toProblem(error)))),
      );
  }
}

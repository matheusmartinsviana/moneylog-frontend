import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, Observable, of, startWith, Subject, switchMap } from 'rxjs';

import { SimulationsGateway } from '~/modules/simulations/core/interfaces/simulations.gateway';
import type {
  PurchaseSimulation,
  PurchaseSimulationInput,
} from '~/modules/simulations/core/types/simulation';
import { Problem, problemOf } from '~/util/api/problem';

export type PurchaseSimulationState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly result: PurchaseSimulation };

@Injectable()
export class PurchaseSimulationFacade {
  private readonly gateway = inject(SimulationsGateway);
  private readonly runs = new Subject<PurchaseSimulationInput>();
  private readonly current = signal<PurchaseSimulationState>({ status: 'idle' });

  readonly state = this.current.asReadonly();
  readonly result = computed(() => {
    const state = this.current();
    return state.status === 'ready' ? state.result : null;
  });
  readonly problem = computed(() => {
    const state = this.current();
    return state.status === 'error' ? state.problem : null;
  });
  readonly loading = computed(() => this.current().status === 'loading');

  constructor() {
    this.runs
      .pipe(
        switchMap((input) => this.simulate(input)),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));
  }

  run(input: PurchaseSimulationInput): void {
    this.runs.next(input);
  }

  reset(): void {
    this.current.set({ status: 'idle' });
  }

  private simulate(input: PurchaseSimulationInput): Observable<PurchaseSimulationState> {
    return this.gateway.simulatePurchase(input).pipe(
      map((result): PurchaseSimulationState => ({ status: 'ready', result })),
      startWith<PurchaseSimulationState>({ status: 'loading' }),
      catchError((error: unknown) =>
        of<PurchaseSimulationState>({ status: 'error', problem: problemOf(error) }),
      ),
    );
  }
}

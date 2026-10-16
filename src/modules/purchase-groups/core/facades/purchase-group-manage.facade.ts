import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, concatMap, map, Observable, of, Subject, tap } from 'rxjs';

import { PurchaseGroupsGateway } from '~/modules/purchase-groups/core/interfaces/purchase-groups.gateway';
import type {
  PurchaseGroup,
  PurchaseGroupUpdate,
} from '~/modules/purchase-groups/core/types/purchase-group';
import { Problem, problemOf } from '~/util/api/problem';

export type PurchaseGroupChange = 'updated' | 'linked' | 'unlinked';

export interface PurchaseGroupChanged {
  readonly change: PurchaseGroupChange;
  readonly group: PurchaseGroup;
}

interface Operation {
  readonly change: PurchaseGroupChange;
  readonly run: () => Observable<PurchaseGroup>;
}

@Injectable()
export class PurchaseGroupManageFacade {
  private readonly gateway = inject(PurchaseGroupsGateway);
  private readonly operations = new Subject<Operation>();
  private readonly changedEvents = new Subject<PurchaseGroupChanged>();
  private readonly busyState = signal(false);
  private readonly problemState = signal<Problem | null>(null);

  readonly busy = this.busyState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly changed$ = this.changedEvents.asObservable();

  constructor() {
    this.operations
      .pipe(
        concatMap((operation) => {
          this.busyState.set(true);
          this.problemState.set(null);
          return operation.run().pipe(
            tap((group) => this.changedEvents.next({ change: operation.change, group })),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.busyState.set(false);
        this.problemState.set(problem);
      });
  }

  update(id: string, input: PurchaseGroupUpdate): void {
    this.operations.next({ change: 'updated', run: () => this.gateway.update(id, input) });
  }

  link(id: string, transactionId: string): void {
    this.operations.next({
      change: 'linked',
      run: () => this.gateway.addMember(id, transactionId),
    });
  }

  unlink(id: string, transactionId: string): void {
    this.operations.next({
      change: 'unlinked',
      run: () => this.gateway.removeMember(id, transactionId),
    });
  }

  dismissProblem(): void {
    this.problemState.set(null);
  }
}

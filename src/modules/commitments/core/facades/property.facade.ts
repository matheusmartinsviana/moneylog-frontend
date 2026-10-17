import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  concatMap,
  exhaustMap,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { CommitmentsGateway } from '~/modules/commitments/core/interfaces/commitments.gateway';
import type {
  Commitment,
  CommitmentClausesInput,
  CommitmentCsvFile,
  CommitmentSharesInput,
} from '~/modules/commitments/core/types/commitment';
import { Problem, problemOf } from '~/util/api/problem';

export type PropertyState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'notFound' }
  | { readonly status: 'notProject' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly commitment: Commitment };

export type PropertyChange = 'shares' | 'clauses';

type Command =
  | {
      readonly kind: 'shares';
      readonly position: number;
      readonly input: Omit<CommitmentSharesInput, 'version'>;
    }
  | { readonly kind: 'clauses'; readonly input: Omit<CommitmentClausesInput, 'version'> };

const STALE_CODES: ReadonlySet<string> = new Set([
  'VERSION_CONFLICT',
  'COMMITMENT_SCHEDULE_ITEM_NOT_FOUND',
]);

@Injectable()
export class PropertyFacade {
  private readonly gateway = inject(CommitmentsGateway);
  private readonly loads = new Subject<string>();
  private readonly commands = new Subject<Command>();
  private readonly exports = new Subject<string>();
  private readonly changedEvents = new Subject<PropertyChange>();
  private readonly fileEvents = new Subject<CommitmentCsvFile>();
  private readonly current = signal<PropertyState>({ status: 'idle' });
  private readonly busyState = signal(false);
  private readonly exportingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private readonly exportProblemState = signal<Problem | null>(null);
  private currentId: string | null = null;

  readonly state = this.current.asReadonly();
  readonly commitment = computed(() => {
    const state = this.current();
    return state.status === 'ready' ? state.commitment : null;
  });
  readonly loadProblem = computed(() => {
    const state = this.current();
    return state.status === 'error' ? state.problem : null;
  });
  readonly busy = this.busyState.asReadonly();
  readonly exporting = this.exportingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly exportProblem = this.exportProblemState.asReadonly();
  readonly changed$ = this.changedEvents.asObservable();
  readonly file$ = this.fileEvents.asObservable();

  constructor() {
    this.loads
      .pipe(
        switchMap((id) =>
          this.gateway.get(id).pipe(
            map((commitment): PropertyState =>
              commitment.kind === 'LONG_TERM_PROJECT'
                ? { status: 'ready', commitment }
                : { status: 'notProject' },
            ),
            startWith<PropertyState>({ status: 'loading' }),
            catchError((error: unknown) => {
              const problem = problemOf(error);
              return of<PropertyState>(
                problem.status === 404 ? { status: 'notFound' } : { status: 'error', problem },
              );
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.current.set(state));

    this.commands
      .pipe(
        concatMap((command) => {
          const commitment = this.commitment();
          if (!commitment) return of(null);
          this.busyState.set(true);
          this.problemState.set(null);
          return this.send(commitment, command).pipe(
            tap((updated) => {
              this.current.set({ status: 'ready', commitment: updated });
              this.changedEvents.next(command.kind);
            }),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.busyState.set(false);
        this.problemState.set(problem);
        if (problem && STALE_CODES.has(problem.code) && this.currentId !== null) {
          this.loads.next(this.currentId);
        }
      });

    this.exports
      .pipe(
        exhaustMap((language) => {
          const commitment = this.commitment();
          if (!commitment) return of(null);
          this.exportingState.set(true);
          this.exportProblemState.set(null);
          return this.gateway.byPersonCsv(commitment.id, language).pipe(
            tap((file) => this.fileEvents.next(file)),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.exportingState.set(false);
        this.exportProblemState.set(problem);
      });
  }

  load(id: string): void {
    this.currentId = id;
    this.loads.next(id);
  }

  updateShares(position: number, input: Omit<CommitmentSharesInput, 'version'>): void {
    this.commands.next({ kind: 'shares', position, input });
  }

  updateClauses(input: Omit<CommitmentClausesInput, 'version'>): void {
    this.commands.next({ kind: 'clauses', input });
  }

  exportCsv(language: string): void {
    this.exports.next(language);
  }

  clearProblem(): void {
    this.problemState.set(null);
  }

  private send(commitment: Commitment, command: Command): Observable<Commitment> {
    return command.kind === 'shares'
      ? this.gateway.updateShares(commitment.id, command.position, {
          ...command.input,
          version: commitment.version,
        })
      : this.gateway.updateClauses(commitment.id, {
          ...command.input,
          version: commitment.version,
        });
  }
}

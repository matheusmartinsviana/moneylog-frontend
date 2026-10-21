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

import { QuickEntryTokensGateway } from '~/modules/quick-entry/core/interfaces/quick-entry-tokens.gateway';
import type {
  QuickEntrySecret,
  QuickEntryToken,
  QuickEntryTokenInput,
} from '~/modules/quick-entry/core/types/quick-entry-token';
import { Problem, problemOf } from '~/util/api/problem';

export type TokensState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly data: readonly QuickEntryToken[] };

export type TokenAction = 'rename' | 'revoke';

export type TokenNotice =
  | { readonly kind: 'created'; readonly token: QuickEntryToken }
  | { readonly kind: 'renamed'; readonly token: QuickEntryToken }
  | { readonly kind: 'revoked'; readonly token: QuickEntryToken }
  | { readonly kind: 'failed'; readonly action: TokenAction; readonly problem: Problem };

export type CreateState =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting' }
  | { readonly status: 'failed'; readonly problem: Problem };

type TokenCommand =
  | { readonly action: 'rename'; readonly id: string; readonly label: string }
  | { readonly action: 'revoke'; readonly id: string };

type LoadMode = 'initial' | 'refresh';

const LOADING: TokensState = { status: 'loading' };
const IDLE: CreateState = { status: 'idle' };
const STALE_CODES: ReadonlySet<string> = new Set([
  'QUICK_TOKEN_LIMIT_REACHED',
  'QUICK_TOKEN_NOT_FOUND',
]);

function newestFirst(tokens: readonly QuickEntryToken[]): QuickEntryToken[] {
  return [...tokens].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function upsert(state: TokensState, token: QuickEntryToken, atStart: boolean): TokensState {
  if (state.status !== 'ready') return state;
  const exists = state.data.some((entry) => entry.id === token.id);
  const data = exists
    ? state.data.map((entry) => (entry.id === token.id ? token : entry))
    : atStart
      ? [token, ...state.data]
      : [...state.data, token];
  return { status: 'ready', data };
}

@Injectable()
export class QuickEntryTokensFacade {
  private readonly gateway = inject(QuickEntryTokensGateway);
  private readonly loads = new Subject<LoadMode>();
  private readonly creations = new Subject<QuickEntryTokenInput>();
  private readonly commands = new Subject<TokenCommand>();
  private readonly noticeEvents = new Subject<TokenNotice>();
  private readonly listState = signal<TokensState>(LOADING);
  private readonly createCurrent = signal<CreateState>(IDLE);
  private readonly secretCurrent = signal<QuickEntrySecret | null>(null);
  private readonly pending = signal<ReadonlySet<string>>(new Set());

  readonly tokens = this.listState.asReadonly();
  readonly createState = this.createCurrent.asReadonly();
  readonly creating = computed(() => this.createCurrent().status === 'submitting');
  readonly secret = this.secretCurrent.asReadonly();
  readonly busyIds = this.pending.asReadonly();
  readonly notices$ = this.noticeEvents.asObservable();
  readonly forbidden = computed(() => {
    const state = this.listState();
    return state.status === 'error' && state.problem.status === 403;
  });

  constructor() {
    this.loads
      .pipe(
        switchMap((mode) =>
          this.gateway.list().pipe(
            map((data): TokensState => ({ status: 'ready', data: newestFirst(data) })),
            catchError((error: unknown) => of(this.failedLoad(mode, error))),
            startWith(...(mode === 'initial' ? [LOADING] : [])),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.listState.set(state));

    this.creations
      .pipe(
        exhaustMap((input) => {
          this.createCurrent.set({ status: 'submitting' });
          return this.gateway.create(input).pipe(
            tap((creation) => {
              this.secretCurrent.set({ label: creation.token.label, value: creation.secret });
              this.listState.update((state) => upsert(state, creation.token, true));
              if (this.listState().status !== 'ready') this.loads.next('initial');
              this.createCurrent.set(IDLE);
              this.noticeEvents.next({ kind: 'created', token: creation.token });
            }),
            catchError((error: unknown) => {
              const problem = problemOf(error);
              this.reloadStale(problem);
              this.createCurrent.set({ status: 'failed', problem });
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();

    this.commands
      .pipe(
        concatMap((command) =>
          this.run(command).pipe(
            tap({ finalize: () => this.release(command.id) }),
            catchError((error: unknown) => {
              const problem = problemOf(error);
              this.reloadStale(problem);
              this.noticeEvents.next({ kind: 'failed', action: command.action, problem });
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  load(): void {
    this.loads.next('initial');
  }

  create(input: QuickEntryTokenInput): void {
    this.creations.next(input);
  }

  clearCreateProblem(): void {
    if (this.createCurrent().status === 'failed') this.createCurrent.set(IDLE);
  }

  dismissSecret(): void {
    this.secretCurrent.set(null);
  }

  rename(id: string, label: string): void {
    this.dispatch({ action: 'rename', id, label });
  }

  revoke(id: string): void {
    this.dispatch({ action: 'revoke', id });
  }

  private dispatch(command: TokenCommand): void {
    if (this.pending().has(command.id)) return;
    this.pending.update((ids) => new Set(ids).add(command.id));
    this.commands.next(command);
  }

  private release(id: string): void {
    this.pending.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }

  private run(command: TokenCommand): Observable<unknown> {
    if (command.action === 'rename') {
      return this.gateway.rename(command.id, command.label).pipe(
        tap((token) => {
          this.listState.update((state) => upsert(state, token, false));
          this.noticeEvents.next({ kind: 'renamed', token });
        }),
      );
    }
    return this.gateway.revoke(command.id).pipe(
      tap((token) => {
        this.listState.update((state) => upsert(state, token, false));
        this.noticeEvents.next({ kind: 'revoked', token });
      }),
    );
  }

  private failedLoad(mode: LoadMode, error: unknown): TokensState {
    const current = this.listState();
    if (mode === 'refresh' && current.status === 'ready') return current;
    return { status: 'error', problem: problemOf(error) };
  }

  private reloadStale(problem: Problem): void {
    if (STALE_CODES.has(problem.code)) this.loads.next('refresh');
  }
}

import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  exhaustMap,
  expand,
  filter,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { NotesGateway } from '~/modules/notes/core/interfaces/notes.gateway';
import type { Note, NotesQuery, NoteSummary, TagCount } from '~/modules/notes/core/types/note';
import { MAX_SEARCH_LENGTH } from '~/modules/notes/core/types/note';
import { NO_FILTERS, type NotesFilters } from '~/modules/notes/core/types/note-filters';
import { buildFolderTree, FolderNode } from '~/modules/notes/core/types/note-path';
import { Problem, problemOf } from '~/util/api/problem';
import { MAX_PAGE_SIZE } from '~/util/api/slice';

export type NotesListState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | {
      readonly status: 'ready';
      readonly items: readonly NoteSummary[];
      readonly hasNext: boolean;
    };

export const SEARCH_DEBOUNCE_MS = 300;
export const TREE_INITIAL_PAGES = 2;
export const TREE_STEP_PAGES = 4;
export const TREE_MAX_PAGES = 20;

type Command = { readonly kind: 'load' } | { readonly kind: 'more' };

@Injectable()
export class NotesListFacade {
  private readonly gateway = inject(NotesGateway);
  private readonly destroyRef = inject(DestroyRef);
  private readonly commands = new Subject<Command>();
  private readonly searches = new Subject<string>();
  private readonly restores = new Subject<string>();
  private readonly empties = new Subject<void>();
  private readonly restoredEvents = new Subject<Note>();
  private readonly emptiedEvents = new Subject<void>();

  private readonly filtersState = signal<NotesFilters>(NO_FILTERS);
  private readonly listState = signal<NotesListState>({ status: 'loading' });
  private readonly loadingMoreState = signal(false);
  private readonly tagsState = signal<readonly TagCount[]>([]);
  private readonly treeState = signal<FolderNode>(buildFolderTree([]));
  private readonly treeLoadedState = signal(false);
  private readonly treeMoreState = signal<'none' | 'available' | 'capped'>('none');
  private readonly treeLoadingMoreState = signal(false);
  private readonly treeNotesState = signal(0);
  private treePaths: { readonly path: string }[] = [];
  private treePagesLoaded = 0;
  private treeRequest: { unsubscribe(): void } | null = null;
  private readonly actionProblemState = signal<Problem | null>(null);
  private readonly busyState = signal(false);
  private page = 1;
  private started = false;

  readonly filters = this.filtersState.asReadonly();
  readonly state = this.listState.asReadonly();
  readonly loadingMore = this.loadingMoreState.asReadonly();
  readonly tags = this.tagsState.asReadonly();
  readonly tree = this.treeState.asReadonly();
  readonly treeLoaded = this.treeLoadedState.asReadonly();
  readonly treeMore = this.treeMoreState.asReadonly();
  readonly treeLoadingMore = this.treeLoadingMoreState.asReadonly();
  readonly treeNotes = this.treeNotesState.asReadonly();
  readonly actionProblem = this.actionProblemState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly restored$ = this.restoredEvents.asObservable();
  readonly emptied$ = this.emptiedEvents.asObservable();

  readonly filtered = computed(() => {
    const f = this.filtersState();
    return f.q !== '' || f.tag !== null || f.folder !== null;
  });
  readonly items = computed(() => {
    const state = this.listState();
    return state.status === 'ready' ? state.items : null;
  });
  readonly hasNext = computed(() => {
    const state = this.listState();
    return state.status === 'ready' && state.hasNext;
  });
  readonly error = computed(() => {
    const state = this.listState();
    return state.status === 'error' ? state.problem : null;
  });

  constructor() {
    this.commands
      .pipe(
        switchMap((command) => (command.kind === 'load' ? this.loadFirst() : this.loadNext())),
        takeUntilDestroyed(),
      )
      .subscribe();

    this.searches
      .pipe(
        map((term) => term.trim().slice(0, MAX_SEARCH_LENGTH)),
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged(),
        filter((term) => term !== this.filtersState().q),
        takeUntilDestroyed(),
      )
      .subscribe((q) => {
        this.started = true;
        this.filtersState.update((f) => ({ ...f, q }));
        this.commands.next({ kind: 'load' });
      });

    this.restores
      .pipe(
        exhaustMap((id) => {
          this.busyState.set(true);
          this.actionProblemState.set(null);
          return this.gateway.restore(id).pipe(
            tap((note) => {
              this.listState.update((s) =>
                s.status === 'ready'
                  ? { ...s, items: s.items.filter((item) => item.id !== note.id) }
                  : s,
              );
              this.restoredEvents.next(note);
              this.reloadTree();
              this.reloadTags();
            }),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.busyState.set(false);
        this.actionProblemState.set(problem);
      });

    this.empties
      .pipe(
        exhaustMap(() => {
          this.busyState.set(true);
          this.actionProblemState.set(null);
          return this.gateway.emptyTrash().pipe(
            tap(() => {
              this.listState.set({ status: 'ready', items: [], hasNext: false });
              this.emptiedEvents.next();
            }),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.busyState.set(false);
        this.actionProblemState.set(problem);
      });
  }

  apply(filters: NotesFilters): void {
    const current = this.filtersState();
    const same =
      current.q === filters.q &&
      current.tag === filters.tag &&
      current.folder === filters.folder &&
      current.view === filters.view;
    if (this.started && same) return;
    this.started = true;
    this.filtersState.set(filters);
    this.commands.next({ kind: 'load' });
  }

  search(term: string): void {
    this.searches.next(term);
  }

  retry(): void {
    this.commands.next({ kind: 'load' });
  }

  loadMore(): void {
    const state = this.listState();
    if (state.status === 'ready' && state.hasNext && !this.loadingMoreState()) {
      this.commands.next({ kind: 'more' });
    }
  }

  restore(id: string): void {
    this.restores.next(id);
  }

  emptyTrash(): void {
    this.empties.next();
  }

  dismissProblem(): void {
    this.actionProblemState.set(null);
  }

  loadTreeAndTags(): void {
    this.reloadTree();
    this.reloadTags();
  }

  loadMoreTree(): void {
    if (this.treeMoreState() !== 'available' || this.treeLoadingMoreState()) return;
    this.fetchTreePages(TREE_STEP_PAGES);
  }

  private reloadTree(): void {
    this.treeRequest?.unsubscribe();
    this.treePaths = [];
    this.treePagesLoaded = 0;
    this.treeMoreState.set('none');
    this.treeLoadingMoreState.set(false);
    this.fetchTreePages(TREE_INITIAL_PAGES, true);
  }

  private fetchTreePages(count: number, first = false): void {
    const start = this.treePagesLoaded + 1;
    const limit = Math.min(count, TREE_MAX_PAGES - this.treePagesLoaded);
    if (!first) this.treeLoadingMoreState.set(true);
    const page = (n: number) =>
      this.gateway.list({ status: 'ACTIVE', sort: 'PATH', page: n, pageSize: MAX_PAGE_SIZE });
    this.treeRequest?.unsubscribe();
    this.treeRequest = page(start)
      .pipe(
        expand((slice, index) =>
          slice.hasNext && index + 1 < limit ? page(start + index + 1) : EMPTY,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (slice) => {
          this.treePagesLoaded += 1;
          this.treePaths = [...this.treePaths, ...slice.items];
          this.treeState.set(buildFolderTree(this.treePaths));
          this.treeNotesState.set(this.treePaths.length);
          this.treeMoreState.set(
            !slice.hasNext
              ? 'none'
              : this.treePagesLoaded >= TREE_MAX_PAGES
                ? 'capped'
                : 'available',
          );
          this.treeLoadedState.set(true);
        },
        error: () => {
          this.treeLoadedState.set(true);
          this.treeLoadingMoreState.set(false);
        },
        complete: () => this.treeLoadingMoreState.set(false),
      });
  }

  private reloadTags(): void {
    this.gateway
      .tags()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (tags) => this.tagsState.set(tags), error: () => undefined });
  }

  private toQuery(page: number): NotesQuery {
    const f = this.filtersState();
    return {
      page,
      pageSize: MAX_PAGE_SIZE,
      status: f.view,
      ...(f.q !== '' ? { q: f.q } : {}),
      ...(f.tag ? { tag: f.tag } : {}),
      ...(f.folder ? { folder: f.folder } : {}),
    };
  }

  private loadFirst(): Observable<unknown> {
    this.page = 1;
    this.loadingMoreState.set(false);
    return this.gateway.list(this.toQuery(1)).pipe(
      map((slice): NotesListState => ({
        status: 'ready',
        items: slice.items,
        hasNext: slice.hasNext,
      })),
      startWith<NotesListState>({ status: 'loading' }),
      catchError((error: unknown) =>
        of<NotesListState>({ status: 'error', problem: problemOf(error) }),
      ),
      tap((state) => this.listState.set(state)),
    );
  }

  private loadNext(): Observable<unknown> {
    this.loadingMoreState.set(true);
    const next = this.page + 1;
    return this.gateway.list(this.toQuery(next)).pipe(
      tap((slice) => {
        this.page = next;
        this.listState.update((s) =>
          s.status === 'ready'
            ? { status: 'ready', items: [...s.items, ...slice.items], hasNext: slice.hasNext }
            : s,
        );
        this.loadingMoreState.set(false);
      }),
      catchError((error: unknown) => {
        this.loadingMoreState.set(false);
        this.actionProblemState.set(problemOf(error));
        return of(null);
      }),
    );
  }
}

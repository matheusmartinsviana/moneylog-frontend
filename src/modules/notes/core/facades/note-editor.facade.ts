import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  exhaustMap,
  expand,
  map,
  Observable,
  of,
  reduce,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { NotesGateway } from '~/modules/notes/core/interfaces/notes.gateway';
import type { Backlink, Note, NoteLinkRef, NoteMoved } from '~/modules/notes/core/types/note';
import {
  applyLinkChange,
  explicitRefs,
  type LinkChange,
} from '~/modules/notes/core/types/note-link-refs';
import { Problem, problemOf } from '~/util/api/problem';
import { MAX_PAGE_SIZE } from '~/util/api/slice';

export type NoteLoadState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly note: Note };

export type BacklinksState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly items: readonly Backlink[] };

export type NoteWrite =
  | { readonly kind: 'save'; readonly body: string; readonly version?: number }
  | { readonly kind: 'move'; readonly newPath: string }
  | { readonly kind: 'trash' }
  | { readonly kind: 'restore' }
  | {
      readonly kind: 'links';
      readonly links: readonly NoteLinkRef[];
      readonly change?: LinkChange;
    };
type Write = NoteWrite;

const MAX_AUTO_REDO = 2;

export interface NoteConflict {
  readonly remote: Note;
  readonly during: Write['kind'];
  readonly redo: Write | null;
}

const BACKLINKS_MAX_PAGES = 4;

@Injectable()
export class NoteEditorFacade {
  private readonly gateway = inject(NotesGateway);
  private readonly destroyRef = inject(DestroyRef);
  private readonly loads = new Subject<string>();
  private readonly writes = new Subject<Write>();
  private readonly backlinkLoads = new Subject<string>();

  private readonly loadState = signal<NoteLoadState>({ status: 'idle' });
  private readonly noteState = signal<Note | null>(null);
  private readonly baselineState = signal('');
  private readonly savingState = signal(false);
  private readonly writingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private readonly conflictState = signal<NoteConflict | null>(null);
  private readonly backlinksState = signal<BacklinksState>({ status: 'loading' });
  private autoRedos = 0;

  private readonly savedEvents = new Subject<{ readonly note: Note; readonly sentBody: string }>();
  private readonly replacedEvents = new Subject<Note>();
  private readonly movedEvents = new Subject<NoteMoved>();
  private readonly trashedEvents = new Subject<Note>();
  private readonly restoredEvents = new Subject<Note>();
  private readonly linksEvents = new Subject<Note>();

  readonly loadStatus = this.loadState.asReadonly();
  readonly note = this.noteState.asReadonly();
  readonly baseline = this.baselineState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly busy = this.writingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly conflict = this.conflictState.asReadonly();
  readonly backlinks = this.backlinksState.asReadonly();
  readonly trashed = computed(() => this.noteState()?.trashedAt != null);

  readonly saved$ = this.savedEvents.asObservable();
  readonly replaced$ = this.replacedEvents.asObservable();
  readonly moved$ = this.movedEvents.asObservable();
  readonly trashed$ = this.trashedEvents.asObservable();
  readonly restored$ = this.restoredEvents.asObservable();
  readonly links$ = this.linksEvents.asObservable();

  constructor() {
    this.loads
      .pipe(
        switchMap((id) =>
          this.gateway.get(id).pipe(
            map((note): NoteLoadState => ({ status: 'ready', note })),
            startWith<NoteLoadState>({ status: 'loading' }),
            catchError((error: unknown) =>
              of<NoteLoadState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => {
        this.loadState.set(state);
        if (state.status === 'ready') {
          this.noteState.set(state.note);
          this.baselineState.set(state.note.body);
          this.conflictState.set(null);
        } else if (state.status === 'error') {
          this.noteState.set(null);
        }
      });

    this.writes
      .pipe(
        exhaustMap((write) => {
          this.writingState.set(true);
          this.savingState.set(write.kind === 'save');
          this.problemState.set(null);
          return this.send(write).pipe(
            tap((result) => this.apply(write, result)),
            map(() => null),
            catchError((error: unknown) => {
              const problem = problemOf(error);
              if (problem.code === 'VERSION_CONFLICT') return this.fetchConflict(write, problem);
              return of(problem);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.writingState.set(false);
        this.savingState.set(false);
        this.problemState.set(problem);
      });

    this.backlinkLoads
      .pipe(
        switchMap((id) => this.loadAllBacklinks(id)),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.backlinksState.set(state));
  }

  load(id: string): void {
    this.loads.next(id);
    this.backlinkLoads.next(id);
  }

  refresh(): void {
    const note = this.noteState();
    if (!note) return;
    this.gateway
      .get(note.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fresh) => {
          this.noteState.update((current) =>
            current && current.id === fresh.id ? fresh : current,
          );
          this.reloadBacklinks();
        },
        error: () => undefined,
      });
  }

  reloadBacklinks(): void {
    const note = this.noteState();
    if (note) this.backlinkLoads.next(note.id);
  }

  save(body: string): void {
    this.writes.next({ kind: 'save', body });
  }

  saveOverConflict(body: string): void {
    const conflict = this.conflictState();
    if (!conflict) return;
    this.writes.next({ kind: 'save', body, version: conflict.remote.version });
  }

  acceptRemote(): void {
    const conflict = this.conflictState();
    if (!conflict) return;
    this.conflictState.set(null);
    this.adopt(conflict.remote);
    this.replacedEvents.next(conflict.remote);
  }

  adoptRemoteAndRedo(): boolean {
    const conflict = this.conflictState();
    const redo = conflict?.redo;
    if (!conflict || !redo || this.autoRedos >= MAX_AUTO_REDO) return false;
    this.autoRedos += 1;
    this.conflictState.set(null);
    this.adopt(conflict.remote);
    this.replacedEvents.next(conflict.remote);
    if (redo.kind === 'links' && redo.change) {
      this.writes.next({
        kind: 'links',
        links: applyLinkChange(explicitRefs(conflict.remote.links), redo.change),
        change: redo.change,
      });
    } else {
      this.writes.next(redo);
    }
    return true;
  }

  move(newPath: string): void {
    this.writes.next({ kind: 'move', newPath });
  }

  trash(): void {
    this.writes.next({ kind: 'trash' });
  }

  restore(): void {
    this.writes.next({ kind: 'restore' });
  }

  setLinks(links: readonly NoteLinkRef[], change?: LinkChange): void {
    this.writes.next({ kind: 'links', links, change });
  }

  dismissProblem(): void {
    this.problemState.set(null);
  }

  private adopt(note: Note): void {
    this.noteState.set(note);
    this.baselineState.set(note.body);
  }

  private send(write: Write): Observable<Note | NoteMoved> {
    const note = this.noteState();
    if (!note) return EMPTY;
    switch (write.kind) {
      case 'save':
        return this.gateway.update(note.id, write.body, write.version ?? note.version);
      case 'move':
        return this.gateway.move(note.id, write.newPath, note.version);
      case 'trash':
        return this.gateway.trash(note.id);
      case 'restore':
        return this.gateway.restore(note.id);
      case 'links':
        return this.gateway.setLinks(note.id, write.links, note.version);
    }
  }

  private apply(write: Write, result: Note | NoteMoved): void {
    this.conflictState.set(null);
    this.autoRedos = 0;
    switch (write.kind) {
      case 'save': {
        const note = result as Note;
        this.noteState.set(note);
        this.baselineState.set(write.body);
        this.savedEvents.next({ note, sentBody: write.body });
        this.reloadBacklinks();
        break;
      }
      case 'move': {
        const moved = result as NoteMoved;
        this.adopt(moved.note);
        this.movedEvents.next(moved);
        this.reloadBacklinks();
        break;
      }
      case 'trash': {
        const note = result as Note;
        this.adopt(note);
        this.trashedEvents.next(note);
        this.reloadBacklinks();
        break;
      }
      case 'restore': {
        const note = result as Note;
        this.adopt(note);
        this.restoredEvents.next(note);
        this.reloadBacklinks();
        break;
      }
      case 'links': {
        const note = result as Note;
        this.noteState.set(note);
        this.linksEvents.next(note);
        break;
      }
    }
  }

  private fetchConflict(write: Write, problem: Problem): Observable<Problem | null> {
    const note = this.noteState();
    if (!note) return of(problem);
    return this.gateway.get(note.id).pipe(
      map((remote): Problem | null => {
        if (write.kind === 'save' && remote.body === write.body) {
          this.apply(write, remote);
          return null;
        }
        const redo = write.kind === 'move' || write.kind === 'links' ? write : null;
        this.conflictState.set({ remote, during: write.kind, redo });
        return problem;
      }),
      catchError(() => of(problem)),
    );
  }

  private loadAllBacklinks(id: string): Observable<BacklinksState> {
    const page = (n: number) => this.gateway.backlinks(id, n, MAX_PAGE_SIZE);
    return page(1).pipe(
      expand((slice, index) =>
        slice.hasNext && index + 1 < BACKLINKS_MAX_PAGES ? page(index + 2) : EMPTY,
      ),
      reduce(
        (all: readonly Backlink[], slice) => [...all, ...slice.items],
        [] as readonly Backlink[],
      ),
      map((items): BacklinksState => ({ status: 'ready', items })),
      startWith<BacklinksState>({ status: 'loading' }),
      catchError((error: unknown) =>
        of<BacklinksState>({ status: 'error', problem: problemOf(error) }),
      ),
    );
  }
}

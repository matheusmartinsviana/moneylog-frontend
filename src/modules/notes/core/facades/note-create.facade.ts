import { inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, exhaustMap, map, of, Subject, tap } from 'rxjs';

import { NotesGateway } from '~/modules/notes/core/interfaces/notes.gateway';
import type { Note, NoteInput } from '~/modules/notes/core/types/note';
import { IdempotencyTracker } from '~/util/api/idempotency-key';
import { Problem, problemOf } from '~/util/api/problem';

@Injectable()
export class NoteCreateFacade {
  private readonly gateway = inject(NotesGateway);
  private readonly submits = new Subject<NoteInput>();
  private readonly createdEvents = new Subject<Note>();
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private readonly keys = new IdempotencyTracker<NoteInput>();

  readonly saving = this.savingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly created$ = this.createdEvents.asObservable();

  constructor() {
    this.submits
      .pipe(
        exhaustMap((input) => {
          this.savingState.set(true);
          this.problemState.set(null);
          return this.gateway.create(input, this.keys.begin(input)).pipe(
            tap((note) => {
              this.keys.succeeded();
              this.createdEvents.next(note);
            }),
            map(() => null),
            catchError((error: unknown) => of(problemOf(error))),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((problem) => {
        this.savingState.set(false);
        if (problem !== null) this.keys.failed(problem);
        this.problemState.set(problem);
      });
  }

  create(input: NoteInput): void {
    this.submits.next(input);
  }

  dismissProblem(): void {
    this.problemState.set(null);
  }
}

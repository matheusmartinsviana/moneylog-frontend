import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  exhaustMap,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { PeopleGateway } from '~/modules/people/core/interfaces/people.gateway';
import type { Person, PersonInput, PersonUpdate } from '~/modules/people/core/types/person';
import { IdempotencyTracker } from '~/util/api/idempotency-key';
import { Problem, problemOf } from '~/util/api/problem';

export type SavePerson =
  | { readonly kind: 'create'; readonly input: PersonInput }
  | { readonly kind: 'update'; readonly id: string; readonly input: PersonUpdate };

export type PersonLoadState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly problem: Problem }
  | { readonly status: 'ready'; readonly person: Person };

const NAME_DEBOUNCE_MS = 300;

export function sameName(a: string, b: string): boolean {
  const norm = (text: string) =>
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toLocaleLowerCase();
  return norm(a) === norm(b);
}

@Injectable()
export class PersonFormFacade {
  private readonly gateway = inject(PeopleGateway);
  private readonly saves = new Subject<SavePerson>();
  private readonly loads = new Subject<string>();
  private readonly names = new Subject<{ name: string; selfId: string | null }>();
  private readonly savedEvents = new Subject<Person>();
  private readonly savingState = signal(false);
  private readonly problemState = signal<Problem | null>(null);
  private readonly loadState = signal<PersonLoadState>({ status: 'idle' });
  private readonly loaded = signal<Person | null>(null);
  private readonly homonymState = signal(false);
  private readonly keys = new IdempotencyTracker<PersonInput>();

  readonly saving = this.savingState.asReadonly();
  readonly problem = this.problemState.asReadonly();
  readonly loadStatus = this.loadState.asReadonly();
  readonly person = this.loaded.asReadonly();
  readonly homonym = computed(() => this.homonymState());
  readonly saved$ = this.savedEvents.asObservable();

  constructor() {
    this.saves
      .pipe(
        exhaustMap((command) => {
          this.savingState.set(true);
          this.problemState.set(null);
          return this.send(command).pipe(
            tap((person) => {
              this.keys.succeeded();
              this.savedEvents.next(person);
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

    this.loads
      .pipe(
        switchMap((id) =>
          this.gateway.get(id).pipe(
            map((person): PersonLoadState => ({ status: 'ready', person })),
            startWith<PersonLoadState>({ status: 'loading' }),
            catchError((error: unknown) =>
              of<PersonLoadState>({ status: 'error', problem: problemOf(error) }),
            ),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => {
        this.loadState.set(state);
        if (state.status === 'ready') this.loaded.set(state.person);
        else if (state.status === 'error') this.loaded.set(null);
      });

    this.names
      .pipe(
        debounceTime(NAME_DEBOUNCE_MS),
        distinctUntilChanged((a, b) => a.name === b.name && a.selfId === b.selfId),
        switchMap(({ name, selfId }) =>
          name === ''
            ? of(false)
            : this.gateway.list({ q: name, page: 1, pageSize: 10 }).pipe(
                map((slice) =>
                  slice.items.some((item) => item.id !== selfId && sameName(item.name, name)),
                ),
                catchError(() => of(false)),
              ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((exists) => this.homonymState.set(exists));
  }

  load(id: string): void {
    this.loads.next(id);
  }

  dismissProblem(): void {
    this.problemState.set(null);
  }

  save(command: SavePerson): void {
    this.saves.next(command);
  }

  checkName(name: string, selfId: string | null = null): void {
    this.names.next({ name: name.trim(), selfId });
  }

  private send(command: SavePerson): Observable<Person> {
    return command.kind === 'create'
      ? this.gateway.create(command.input, this.keys.begin(command.input))
      : this.gateway.update(command.id, command.input);
  }
}

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

import { InvitationsGateway } from '~/modules/users/core/interfaces/invitations.gateway';
import { UsersGateway } from '~/modules/users/core/interfaces/users.gateway';
import type { Invitation, ManagedUser } from '~/modules/users/core/types/access';
import { Problem, problemOf } from '~/util/api/problem';

export type ListState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly data: readonly T[] }
  | { readonly status: 'error'; readonly problem: Problem };

export type InviteState =
  | { readonly status: 'idle' }
  | { readonly status: 'submitting' }
  | { readonly status: 'failed'; readonly problem: Problem };

export type AccessAction = 'resend' | 'revoke' | 'disable' | 'enable';

export type AccessNotice =
  | { readonly kind: 'invited'; readonly invitation: Invitation }
  | { readonly kind: 'resent'; readonly invitation: Invitation }
  | { readonly kind: 'revoked'; readonly invitation: Invitation }
  | { readonly kind: 'disabled'; readonly user: ManagedUser }
  | { readonly kind: 'enabled'; readonly user: ManagedUser }
  | { readonly kind: 'failed'; readonly action: AccessAction; readonly problem: Problem };

interface ItemCommand {
  readonly action: AccessAction;
  readonly id: string;
}

type LoadMode = 'initial' | 'refresh';

const LOADING = { status: 'loading' } as const;
const IDLE: InviteState = { status: 'idle' };
const INVITATIONS_OFF = 'INVITATIONS_DISABLED';
const STALE_INVITATION_CODES: ReadonlySet<string> = new Set([
  'EMAIL_DELIVERY_FAILED',
  'INVITATION_NOT_RESENDABLE',
  'INVITATION_NOT_REVOCABLE',
  'INVITATION_NOT_FOUND',
  'INVITATION_PENDING',
  'EMAIL_ALREADY_REGISTERED',
]);
const STALE_USER_CODES: ReadonlySet<string> = new Set([
  'EMAIL_ALREADY_REGISTERED',
  'USER_NOT_FOUND',
  'CANNOT_DISABLE_OWNER',
]);

function byCreatedDesc<T extends { readonly createdAt: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function owners(users: readonly ManagedUser[]): ManagedUser[] {
  const rank = (user: ManagedUser) => (user.role === 'OWNER' ? 0 : 1);
  return [...users].sort((a, b) => rank(a) - rank(b) || a.createdAt.localeCompare(b.createdAt));
}

function upsert<T extends { readonly id: string }>(
  state: ListState<T>,
  item: T,
  atStart: boolean,
): ListState<T> {
  if (state.status !== 'ready') return state;
  const exists = state.data.some((entry) => entry.id === item.id);
  const data = exists
    ? state.data.map((entry) => (entry.id === item.id ? item : entry))
    : atStart
      ? [item, ...state.data]
      : [...state.data, item];
  return { status: 'ready', data };
}

@Injectable()
export class AccessAdminFacade {
  private readonly usersGateway = inject(UsersGateway);
  private readonly invitationsGateway = inject(InvitationsGateway);
  private readonly userLoads = new Subject<LoadMode>();
  private readonly invitationLoads = new Subject<LoadMode>();
  private readonly invites = new Subject<string>();
  private readonly commands = new Subject<ItemCommand>();
  private readonly noticeEvents = new Subject<AccessNotice>();
  private readonly userState = signal<ListState<ManagedUser>>(LOADING);
  private readonly invitationState = signal<ListState<Invitation>>(LOADING);
  private readonly inviteCurrent = signal<InviteState>(IDLE);
  private readonly pending = signal<ReadonlySet<string>>(new Set());
  private readonly invitationsOff = signal(false);
  private readonly inviteResetCount = signal(0);

  readonly users = this.userState.asReadonly();
  readonly invitations = this.invitationState.asReadonly();
  readonly inviteState = this.inviteCurrent.asReadonly();
  readonly inviting = computed(() => this.inviteCurrent().status === 'submitting');
  readonly inviteResets = this.inviteResetCount.asReadonly();
  readonly busyIds = this.pending.asReadonly();
  readonly invitationsUnavailable = this.invitationsOff.asReadonly();
  readonly notices$ = this.noticeEvents.asObservable();
  readonly forbidden = computed(() => {
    const users = this.userState();
    const invitations = this.invitationState();
    return (
      (users.status === 'error' && users.problem.status === 403) ||
      (invitations.status === 'error' && invitations.problem.status === 403)
    );
  });

  constructor() {
    this.userLoads
      .pipe(
        switchMap((mode) =>
          this.usersGateway.list().pipe(
            map((data): ListState<ManagedUser> => ({ status: 'ready', data: owners(data) })),
            catchError((error: unknown) => of(this.failedLoad(this.userState(), mode, error))),
            startWith(...(mode === 'initial' ? [LOADING] : [])),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.userState.set(state));

    this.invitationLoads
      .pipe(
        switchMap((mode) =>
          this.invitationsGateway.list().pipe(
            map((data): ListState<Invitation> => ({ status: 'ready', data: byCreatedDesc(data) })),
            catchError((error: unknown) =>
              of(this.failedLoad(this.invitationState(), mode, error)),
            ),
            startWith(...(mode === 'initial' ? [LOADING] : [])),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((state) => this.invitationState.set(state));

    this.invites
      .pipe(
        exhaustMap((email) => {
          this.inviteCurrent.set({ status: 'submitting' });
          return this.invitationsGateway.create(email).pipe(
            tap((invitation) => {
              this.invitationState.update((state) => upsert(state, invitation, true));
              this.inviteCurrent.set(IDLE);
              this.inviteResetCount.update((count) => count + 1);
              this.noticeEvents.next({ kind: 'invited', invitation });
            }),
            catchError((error: unknown) => {
              const problem = problemOf(error);
              this.markUnavailable(problem);
              this.reloadStale(problem);
              if (problem.code === 'EMAIL_DELIVERY_FAILED') {
                this.inviteResetCount.update((count) => count + 1);
              }
              this.inviteCurrent.set({ status: 'failed', problem });
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
              this.markUnavailable(problem);
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
    this.userLoads.next('initial');
    this.invitationLoads.next('initial');
  }

  reloadUsers(): void {
    this.userLoads.next('initial');
  }

  reloadInvitations(): void {
    this.invitationLoads.next('initial');
  }

  invite(email: string): void {
    this.invites.next(email);
  }

  clearInviteProblem(): void {
    if (this.inviteCurrent().status === 'failed') this.inviteCurrent.set(IDLE);
  }

  resend(id: string): void {
    this.dispatch({ action: 'resend', id });
  }

  revoke(id: string): void {
    this.dispatch({ action: 'revoke', id });
  }

  disable(id: string): void {
    this.dispatch({ action: 'disable', id });
  }

  enable(id: string): void {
    this.dispatch({ action: 'enable', id });
  }

  private dispatch(command: ItemCommand): void {
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

  private run(command: ItemCommand): Observable<unknown> {
    switch (command.action) {
      case 'resend':
        return this.invitationsGateway.resend(command.id).pipe(
          tap((invitation) => {
            this.invitationState.update((state) => upsert(state, invitation, false));
            this.noticeEvents.next({ kind: 'resent', invitation });
          }),
        );
      case 'revoke':
        return this.invitationsGateway.revoke(command.id).pipe(
          tap((invitation) => {
            this.invitationState.update((state) => upsert(state, invitation, false));
            this.noticeEvents.next({ kind: 'revoked', invitation });
          }),
        );
      case 'disable':
        return this.usersGateway.disable(command.id).pipe(
          tap((user) => {
            this.userState.update((state) => upsert(state, user, false));
            this.noticeEvents.next({ kind: 'disabled', user });
          }),
        );
      case 'enable':
        return this.usersGateway.enable(command.id).pipe(
          tap((user) => {
            this.userState.update((state) => upsert(state, user, false));
            this.noticeEvents.next({ kind: 'enabled', user });
          }),
        );
    }
  }

  private failedLoad<T>(current: ListState<T>, mode: LoadMode, error: unknown): ListState<T> {
    if (mode === 'refresh' && current.status === 'ready') return current;
    return { status: 'error', problem: problemOf(error) };
  }

  private markUnavailable(problem: Problem): void {
    if (problem.code === INVITATIONS_OFF) this.invitationsOff.set(true);
  }

  private reloadStale(problem: Problem): void {
    if (STALE_INVITATION_CODES.has(problem.code)) this.invitationLoads.next('refresh');
    if (STALE_USER_CODES.has(problem.code)) this.userLoads.next('refresh');
  }
}

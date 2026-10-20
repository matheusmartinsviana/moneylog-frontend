import { Provider } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import { InvitationsGateway } from '~/modules/users/core/interfaces/invitations.gateway';
import { UsersGateway } from '~/modules/users/core/interfaces/users.gateway';
import type { Invitation, ManagedUser } from '~/modules/users/core/types/access';
import { aProblem } from '~/testing/accounts-testing';
import { ProblemError } from '~/util/api/problem';

export function aManagedUser(overrides: Partial<ManagedUser> = {}): ManagedUser {
  return {
    id: 'user-2',
    email: 'convidado@moneylog.app',
    role: 'MEMBER',
    status: 'ACTIVE',
    createdAt: '2026-10-12T12:00:00Z',
    lastLoginAt: null,
    ...overrides,
  };
}

export const OWNER_MANAGED = aManagedUser({
  id: '00000000-0000-4000-8000-000000000001',
  email: 'dono@moneylog.app',
  role: 'OWNER',
  createdAt: '2026-01-10T12:00:00Z',
  lastLoginAt: '2026-10-19T09:30:00Z',
});

export function anInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: 'inv-1',
    email: 'novo@moneylog.app',
    status: 'PENDING',
    createdAt: '2026-10-18T12:00:00Z',
    expiresAt: '2026-10-25T12:00:00Z',
    acceptedAt: null,
    lastSentAt: '2026-10-18T12:00:00Z',
    deliveryStatus: 'SENT',
    ...overrides,
  };
}

export class UsersGatewayStub extends UsersGateway {
  users: ManagedUser[] = [OWNER_MANAGED];
  readonly calls: string[] = [];
  listResult: Observable<readonly ManagedUser[]> | null = null;
  next: Observable<ManagedUser> | null = null;

  list(): Observable<readonly ManagedUser[]> {
    this.calls.push('list');
    return this.listResult ?? of(this.users);
  }

  disable(id: string): Observable<ManagedUser> {
    this.calls.push(`disable:${id}`);
    return this.next ?? of(aManagedUser({ id, status: 'DISABLED' }));
  }

  enable(id: string): Observable<ManagedUser> {
    this.calls.push(`enable:${id}`);
    return this.next ?? of(aManagedUser({ id, status: 'ACTIVE' }));
  }
}

export class InvitationsGatewayStub extends InvitationsGateway {
  invitations: Invitation[] = [];
  readonly calls: string[] = [];
  listResult: Observable<readonly Invitation[]> | null = null;
  next: Observable<Invitation> | null = null;

  list(): Observable<readonly Invitation[]> {
    this.calls.push('list');
    return this.listResult ?? of(this.invitations);
  }

  create(email: string): Observable<Invitation> {
    this.calls.push(`create:${email}`);
    return this.next ?? of(anInvitation({ id: 'inv-new', email }));
  }

  resend(id: string): Observable<Invitation> {
    this.calls.push(`resend:${id}`);
    return (
      this.next ?? of(anInvitation({ id, status: 'PENDING', expiresAt: '2026-10-27T12:00:00Z' }))
    );
  }

  revoke(id: string): Observable<Invitation> {
    this.calls.push(`revoke:${id}`);
    return this.next ?? of(anInvitation({ id, status: 'REVOKED' }));
  }
}

export function provideAccessStubs(
  users: UsersGatewayStub = new UsersGatewayStub(),
  invitations: InvitationsGatewayStub = new InvitationsGatewayStub(),
): Provider[] {
  return [
    { provide: UsersGateway, useValue: users },
    { provide: InvitationsGateway, useValue: invitations },
  ];
}

export function failWithInvitation(status: number, code: string, invitationId?: string) {
  return throwError(
    () => new ProblemError({ ...aProblem(status, code), invitationId: invitationId ?? null }),
  );
}

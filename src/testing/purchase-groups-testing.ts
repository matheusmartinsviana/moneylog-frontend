import { Provider } from '@angular/core';
import { Observable, of } from 'rxjs';

import { PurchaseGroupsGateway } from '~/modules/purchase-groups/core/interfaces/purchase-groups.gateway';
import type {
  PurchaseCommitments,
  PurchaseGroup,
  PurchaseGroupInput,
  PurchaseGroupMember,
  PurchaseGroupStatus,
  PurchaseGroupUpdate,
} from '~/modules/purchase-groups/core/types/purchase-group';
import type { Slice } from '~/util/api/slice';

const brl = (amount: string) => ({ amount, currency: 'BRL' });

export function aPurchaseGroupMember(
  overrides: Partial<PurchaseGroupMember> = {},
): PurchaseGroupMember {
  return {
    transactionId: 'tx-a',
    card: { id: 'card-a', name: 'Cartão A' },
    description: 'Sofá, parte 1',
    totalInstallments: 6,
    remainingInstallments: 4,
    installmentAmount: brl('100.00'),
    total: brl('600.00'),
    remaining: brl('400.00'),
    myRemaining: brl('400.00'),
    lastDueDate: '2027-02-05',
    ...overrides,
  };
}

export function aPurchaseGroup(overrides: Partial<PurchaseGroup> = {}): PurchaseGroup {
  return {
    id: 'group-1',
    name: 'Sofá',
    interest: false,
    status: 'ACTIVE',
    total: brl('1200.00'),
    remaining: brl('800.00'),
    myRemaining: brl('800.00'),
    installmentAmountPerMonth: brl('200.00'),
    lastDueDate: '2027-02-05',
    divergence: null,
    members: [
      aPurchaseGroupMember(),
      aPurchaseGroupMember({
        transactionId: 'tx-b',
        card: { id: 'card-b', name: 'Cartão B' },
        description: 'Sofá, parte 2',
      }),
    ],
    version: 1,
    ...overrides,
  };
}

export function someCommitments(overrides: Partial<PurchaseCommitments> = {}): PurchaseCommitments {
  return {
    until: '2027-10',
    committed: brl('800.00'),
    committedMine: brl('650.00'),
    byMonth: [{ competence: '2026-11', amount: brl('200.00'), mine: brl('150.00') }],
    ...overrides,
  };
}

export class PurchaseGroupsGatewayStub extends PurchaseGroupsGateway {
  groups: PurchaseGroup[] = [aPurchaseGroup()];
  list$: ((status: PurchaseGroupStatus) => Observable<Slice<PurchaseGroup>>) | null = null;
  commitments$: Observable<PurchaseCommitments> | null = null;
  create$: Observable<PurchaseGroup> | null = null;
  update$: Observable<PurchaseGroup> | null = null;
  addMember$: Observable<PurchaseGroup> | null = null;
  removeMember$: Observable<PurchaseGroup> | null = null;
  readonly listStatuses: PurchaseGroupStatus[] = [];
  readonly commitmentsUntil: string[] = [];
  readonly creates: { input: PurchaseGroupInput; key: string }[] = [];
  readonly updates: { id: string; input: PurchaseGroupUpdate }[] = [];
  readonly added: { id: string; transactionId: string }[] = [];
  readonly removed: { id: string; transactionId: string }[] = [];

  list(status: PurchaseGroupStatus): Observable<Slice<PurchaseGroup>> {
    this.listStatuses.push(status);
    if (this.list$) return this.list$(status);
    return of({ items: this.groups.filter((group) => group.status === status), hasNext: false });
  }

  create(input: PurchaseGroupInput, idempotencyKey: string): Observable<PurchaseGroup> {
    this.creates.push({ input, key: idempotencyKey });
    return this.create$ ?? of(aPurchaseGroup({ name: input.name }));
  }

  update(id: string, input: PurchaseGroupUpdate): Observable<PurchaseGroup> {
    this.updates.push({ id, input });
    return this.update$ ?? of(aPurchaseGroup({ id, name: input.name, version: input.version + 1 }));
  }

  addMember(id: string, transactionId: string): Observable<PurchaseGroup> {
    this.added.push({ id, transactionId });
    return this.addMember$ ?? of(aPurchaseGroup({ id }));
  }

  removeMember(id: string, transactionId: string): Observable<PurchaseGroup> {
    this.removed.push({ id, transactionId });
    return this.removeMember$ ?? of(aPurchaseGroup({ id }));
  }

  commitments(until: string): Observable<PurchaseCommitments> {
    this.commitmentsUntil.push(until);
    return this.commitments$ ?? of(someCommitments({ until }));
  }
}

export function providePurchaseGroupsStub(
  stub: PurchaseGroupsGatewayStub = new PurchaseGroupsGatewayStub(),
): Provider[] {
  return [{ provide: PurchaseGroupsGateway, useValue: stub }];
}

import { Provider } from '@angular/core';
import { Observable, of } from 'rxjs';

import { AssetsGateway } from '~/modules/assets/core/interfaces/assets.gateway';
import type {
  Asset,
  AssetBalanceInput,
  AssetInput,
  AssetStatus,
  AssetUpdate,
} from '~/modules/assets/core/types/asset';
import { NetWorthGateway } from '~/modules/net-worth/core/interfaces/net-worth.gateway';
import type { NetWorthOverview } from '~/modules/net-worth/core/types/net-worth';
import type { Slice } from '~/util/api/slice';

const brl = (amount: string) => ({ amount, currency: 'BRL' });

export function anAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'asset-1',
    kind: 'FGTS',
    name: 'FGTS Empresa A',
    employer: 'Empresa A',
    balance: brl('30000.00'),
    balanceDate: '2026-10-01',
    monthlyDeposit: brl('800.00'),
    availability: 'RESERVED',
    countsAsReserve: false,
    status: 'ACTIVE',
    history: [
      { balance: brl('29200.00'), date: '2026-09-01', recordedAt: '2026-09-02T10:00:00Z' },
      { balance: brl('30000.00'), date: '2026-10-01', recordedAt: '2026-10-02T10:00:00Z' },
    ],
    version: 1,
    ...overrides,
  };
}

export function aNetWorth(overrides: Partial<NetWorthOverview> = {}): NetWorthOverview {
  return {
    availableCash: brl('5000.00'),
    availableAssets: brl('2000.00'),
    reservedAssets: brl('30000.00'),
    receivablesPending: brl('700.00'),
    debts: brl('1500.00'),
    emergencyReserve: {
      amount: brl('2000.00'),
      monthlyBase: brl('1000.00'),
      coverageMonths: '2.0',
      targetMonths: null,
      targetAmount: null,
      missingToTarget: null,
    },
    ...overrides,
  };
}

export class AssetsGatewayStub extends AssetsGateway {
  assets: Asset[] = [anAsset()];
  list$: ((status: AssetStatus) => Observable<Slice<Asset>>) | null = null;
  get$: Observable<Asset> | null = null;
  create$: Observable<Asset> | null = null;
  update$: Observable<Asset> | null = null;
  archive$: Observable<Asset> | null = null;
  balance$: Observable<Asset> | null = null;
  readonly listStatuses: AssetStatus[] = [];
  readonly creates: { input: AssetInput; key: string }[] = [];
  readonly updates: { id: string; input: AssetUpdate }[] = [];
  readonly archives: string[] = [];
  readonly balances: { id: string; input: AssetBalanceInput }[] = [];
  readonly gets: string[] = [];

  list(status: AssetStatus): Observable<Slice<Asset>> {
    this.listStatuses.push(status);
    if (this.list$) return this.list$(status);
    return of({ items: this.assets.filter((asset) => asset.status === status), hasNext: false });
  }

  get(id: string): Observable<Asset> {
    this.gets.push(id);
    return this.get$ ?? of(this.assets.find((asset) => asset.id === id) ?? anAsset({ id }));
  }

  create(input: AssetInput, idempotencyKey: string): Observable<Asset> {
    this.creates.push({ input, key: idempotencyKey });
    return this.create$ ?? of(anAsset({ name: input.name }));
  }

  update(id: string, input: AssetUpdate): Observable<Asset> {
    this.updates.push({ id, input });
    return this.update$ ?? of(anAsset({ id, name: input.name }));
  }

  archive(id: string): Observable<Asset> {
    this.archives.push(id);
    return this.archive$ ?? of(anAsset({ id, status: 'ARCHIVED' }));
  }

  updateBalance(id: string, input: AssetBalanceInput): Observable<Asset> {
    this.balances.push({ id, input });
    return this.balance$ ?? of(anAsset({ id, balance: brl(input.balance) }));
  }
}

export class NetWorthGatewayStub extends NetWorthGateway {
  overview$: Observable<NetWorthOverview> | null = null;
  readonly targets: (number | null)[] = [];

  overview(targetMonths: number | null): Observable<NetWorthOverview> {
    this.targets.push(targetMonths);
    return this.overview$ ?? of(aNetWorth());
  }
}

export function provideNetWorthStubs(
  assets: AssetsGatewayStub = new AssetsGatewayStub(),
  netWorth: NetWorthGatewayStub = new NetWorthGatewayStub(),
): Provider[] {
  return [
    { provide: AssetsGateway, useValue: assets },
    { provide: NetWorthGateway, useValue: netWorth },
  ];
}

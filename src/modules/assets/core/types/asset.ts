import type { Money } from '~/util/money';

export const ASSET_CURRENCY = 'BRL';

export type AssetKind = 'FGTS' | 'OTHER';
export type AssetAvailability = 'RESERVED' | 'AVAILABLE';
export type AssetStatus = 'ACTIVE' | 'ARCHIVED';

export interface AssetBalancePoint {
  readonly balance: Money;
  readonly date: string;
  readonly recordedAt: string;
}

export interface Asset {
  readonly id: string;
  readonly kind: AssetKind;
  readonly name: string;
  readonly employer: string | null;
  readonly balance: Money;
  readonly balanceDate: string;
  readonly monthlyDeposit: Money | null;
  readonly availability: AssetAvailability;
  readonly countsAsReserve: boolean;
  readonly status: AssetStatus;
  readonly history: readonly AssetBalancePoint[];
  readonly version: number;
}

export interface AssetInput {
  readonly kind: AssetKind;
  readonly name: string;
  readonly employer: string | null;
  readonly balance: string;
  readonly balanceDate: string;
  readonly monthlyDeposit: string | null;
  readonly availability: AssetAvailability;
  readonly countsAsReserve: boolean;
}

export interface AssetUpdate {
  readonly kind: AssetKind;
  readonly name: string;
  readonly employer: string | null;
  readonly monthlyDeposit: string | null;
  readonly availability: AssetAvailability;
  readonly countsAsReserve: boolean;
  readonly version: number;
}

export interface AssetBalanceInput {
  readonly balance: string;
  readonly date: string;
}

export function effectiveAvailability(
  kind: AssetKind,
  availability: AssetAvailability,
): AssetAvailability {
  return kind === 'FGTS' ? 'RESERVED' : availability;
}

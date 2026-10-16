import type { Asset, AssetInput, AssetUpdate } from '~/modules/assets/core/types/asset';
import type {
  AssetCreateRequest,
  AssetResponse,
  AssetUpdateRequest,
} from '~/modules/assets/infra/responses/asset.response';
import type { Money } from '~/util/money';

const money = (value: { amount: string; currency: string }): Money => ({
  amount: value.amount,
  currency: value.currency,
});

export function toAsset(response: AssetResponse): Asset {
  return {
    id: response.id,
    kind: response.kind,
    name: response.name,
    employer: response.employer,
    balance: money(response.balance),
    balanceDate: response.balanceDate,
    monthlyDeposit: response.monthlyDeposit ? money(response.monthlyDeposit) : null,
    availability: response.availability,
    countsAsReserve: response.countsAsReserve,
    status: response.status,
    history: response.history.map((point) => ({
      balance: money(point.balance),
      date: point.date,
      recordedAt: point.recordedAt,
    })),
    version: response.version,
  };
}

function cleanEmployer(value: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

export function toCreateRequest(input: AssetInput): AssetCreateRequest {
  return {
    kind: input.kind,
    name: input.name.trim(),
    employer: cleanEmployer(input.employer),
    balance: input.balance,
    balanceDate: input.balanceDate,
    monthlyDeposit: input.monthlyDeposit,
    availability: input.kind === 'FGTS' ? 'RESERVED' : input.availability,
    countsAsReserve:
      input.availability === 'AVAILABLE' && input.kind !== 'FGTS' && input.countsAsReserve,
  };
}

export function toUpdateRequest(input: AssetUpdate): AssetUpdateRequest {
  return {
    kind: input.kind,
    name: input.name.trim(),
    employer: cleanEmployer(input.employer),
    monthlyDeposit: input.monthlyDeposit,
    availability: input.kind === 'FGTS' ? 'RESERVED' : input.availability,
    countsAsReserve:
      input.availability === 'AVAILABLE' && input.kind !== 'FGTS' && input.countsAsReserve,
    version: input.version,
  };
}

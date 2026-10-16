import { Observable } from 'rxjs';

import type {
  Asset,
  AssetBalanceInput,
  AssetInput,
  AssetStatus,
  AssetUpdate,
} from '~/modules/assets/core/types/asset';
import type { Slice } from '~/util/api/slice';

export abstract class AssetsGateway {
  abstract list(status: AssetStatus, page: number, pageSize: number): Observable<Slice<Asset>>;
  abstract get(id: string): Observable<Asset>;
  abstract create(input: AssetInput, idempotencyKey: string): Observable<Asset>;
  abstract update(id: string, input: AssetUpdate): Observable<Asset>;
  abstract archive(id: string): Observable<Asset>;
  abstract updateBalance(id: string, input: AssetBalanceInput): Observable<Asset>;
}

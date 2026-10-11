import { inject, Injectable } from '@angular/core';

import { DebouncedPreview } from '~/modules/cards/core/facades/debounced-preview';
import { CardsGateway } from '~/modules/cards/core/interfaces/cards.gateway';
import type {
  PurchasePreview,
  PurchasePreviewRequest,
} from '~/modules/cards/core/types/purchase-preview';

interface PurchaseKey extends PurchasePreviewRequest {
  readonly cardId: string;
}

@Injectable()
export class PurchasePreviewFacade {
  private readonly gateway = inject(CardsGateway);
  private readonly preview = new DebouncedPreview<PurchaseKey, PurchasePreview>((key) =>
    this.gateway.previewPurchase(key.cardId, {
      amount: key.amount,
      installments: key.installments,
      date: key.date,
    }),
  );

  readonly state = this.preview.state;
  readonly data = this.preview.data;
  readonly loading = this.preview.loading;
  readonly problem = this.preview.problem;

  request(cardId: string, request: PurchasePreviewRequest | null): void {
    this.preview.request(request === null ? null : { cardId, ...request });
  }
}

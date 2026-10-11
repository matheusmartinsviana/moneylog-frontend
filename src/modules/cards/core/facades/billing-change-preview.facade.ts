import { inject, Injectable } from '@angular/core';

import { DebouncedPreview } from '~/modules/cards/core/facades/debounced-preview';
import { CardsGateway } from '~/modules/cards/core/interfaces/cards.gateway';
import type {
  BillingChangePreview,
  BillingDays,
} from '~/modules/cards/core/types/billing-change-preview';

interface BillingKey extends BillingDays {
  readonly cardId: string;
}

@Injectable()
export class BillingChangePreviewFacade {
  private readonly gateway = inject(CardsGateway);
  private readonly preview = new DebouncedPreview<BillingKey, BillingChangePreview>((key) =>
    this.gateway.previewBillingChange(key.cardId, key.closingDay, key.dueDay),
  );

  readonly state = this.preview.state;
  readonly data = this.preview.data;
  readonly loading = this.preview.loading;
  readonly problem = this.preview.problem;

  request(cardId: string, days: BillingDays | null): void {
    this.preview.request(days === null ? null : { cardId, ...days });
  }
}

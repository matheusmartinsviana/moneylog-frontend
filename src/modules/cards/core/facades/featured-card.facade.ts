import { computed, inject, Injectable, signal } from '@angular/core';

import { CardsListFacade } from '~/modules/cards/core/facades/cards-list.facade';
import { pickFeaturedCard } from '~/modules/cards/core/types/featured-card';
import { readStorage, writeStorage } from '~/util/safe-storage';

export const FEATURED_CARD_KEY = 'moneylog.home.featuredCardId';

@Injectable()
export class FeaturedCardFacade {
  private readonly list = inject(CardsListFacade);
  private readonly remembered = signal<string | null>(readStorage(FEATURED_CARD_KEY) || null);

  readonly state = this.list.state;
  readonly cards = computed(() => this.list.data() ?? []);
  readonly selected = computed(() => pickFeaturedCard(this.cards(), this.remembered()));
  readonly selectedId = computed(() => this.selected()?.id ?? null);

  load(): void {
    this.list.load('ACTIVE');
  }

  select(cardId: string): void {
    if (!this.cards().some((card) => card.id === cardId)) return;
    this.remembered.set(cardId);
    writeStorage(FEATURED_CARD_KEY, cardId);
  }
}

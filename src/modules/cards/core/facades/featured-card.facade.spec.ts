import { TestBed } from '@angular/core/testing';

import { CardsListFacade } from '~/modules/cards/core/facades/cards-list.facade';
import {
  FEATURED_CARD_KEY,
  FeaturedCardFacade,
} from '~/modules/cards/core/facades/featured-card.facade';
import { brl } from '~/testing/accounts-testing';
import {
  aCard,
  anInvoiceSummary,
  CardsGatewayStub,
  provideCardsStub,
} from '~/testing/cards-testing';

const withInvoice = (id: string, total: string) =>
  aCard({ id, currentInvoice: anInvoiceSummary({ id: `inv-${id}`, total: brl(total) }) });

function setup(cards = [withInvoice('a', '300.00'), withInvoice('b', '1283.00')]) {
  const gateway = new CardsGatewayStub();
  gateway.cards = cards;
  TestBed.configureTestingModule({
    providers: [provideCardsStub(gateway), CardsListFacade, FeaturedCardFacade],
  });
  const facade = TestBed.inject(FeaturedCardFacade);
  facade.load();
  return facade;
}

describe('FeaturedCardFacade', () => {
  beforeEach(() => localStorage.removeItem(FEATURED_CARD_KEY));
  afterEach(() => localStorage.removeItem(FEATURED_CARD_KEY));

  it('Dado cartões ativos, quando carrega, então abre no de maior fatura corrente', () => {
    const facade = setup();

    expect(facade.cards().map((c) => c.id)).toEqual(['a', 'b']);
    expect(facade.selectedId()).toBe('b');
  });

  it('Dado que o usuário escolhe outro, então a escolha vale e fica lembrada neste aparelho', () => {
    const facade = setup();

    facade.select('a');

    expect(facade.selectedId()).toBe('a');
    expect(localStorage.getItem(FEATURED_CARD_KEY)).toBe('a');
  });

  it('Dado uma escolha lembrada de outra sessão, então ela abre selecionada', () => {
    localStorage.setItem(FEATURED_CARD_KEY, 'a');

    expect(setup().selectedId()).toBe('a');
  });

  it('Dado um id que não está na lista, então a seleção é ignorada', () => {
    const facade = setup();

    facade.select('desconhecido');

    expect(facade.selectedId()).toBe('b');
    expect(localStorage.getItem(FEATURED_CARD_KEY)).toBeNull();
  });

  it('Dado nenhum cartão, então não há seleção e o estado é vazio', () => {
    const facade = setup([]);

    expect(facade.selected()).toBeNull();
    expect(facade.state().status).toBe('empty');
  });
});

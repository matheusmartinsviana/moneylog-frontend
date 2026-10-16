import { pickFeaturedCard } from '~/modules/cards/core/types/featured-card';
import { brl } from '~/testing/accounts-testing';
import { aCard, anInvoiceSummary } from '~/testing/cards-testing';

const withInvoice = (id: string, total: string) =>
  aCard({ id, currentInvoice: anInvoiceSummary({ id: `inv-${id}`, total: brl(total) }) });

describe('pickFeaturedCard', () => {
  it('Dado nenhum cartão, então não há destaque', () => {
    expect(pickFeaturedCard([], null)).toBeNull();
  });

  it('Dado cartões sem escolha lembrada, então abre no de maior fatura corrente', () => {
    const cards = [
      withInvoice('a', '300.00'),
      withInvoice('b', '1283.00'),
      withInvoice('c', '999.99'),
    ];

    expect(pickFeaturedCard(cards, null)?.id).toBe('b');
  });

  it('Dado valores com casas diferentes, então compara como decimal exato', () => {
    const cards = [withInvoice('a', '1000.5'), withInvoice('b', '1000.45')];

    expect(pickFeaturedCard(cards, null)?.id).toBe('a');
  });

  it('Dado escolha lembrada que ainda existe, então ela vence', () => {
    const cards = [withInvoice('a', '300.00'), withInvoice('b', '1283.00')];

    expect(pickFeaturedCard(cards, 'a')?.id).toBe('a');
  });

  it('Dado escolha lembrada que não existe mais, então volta à maior fatura', () => {
    const cards = [withInvoice('a', '300.00'), withInvoice('b', '1283.00')];

    expect(pickFeaturedCard(cards, 'gone')?.id).toBe('b');
  });

  it('Dado cartão sem fatura corrente, então perde para quem tem fatura e o primeiro é o padrão se nenhum tem', () => {
    const noInvoice = aCard({ id: 'x', currentInvoice: null });

    expect(pickFeaturedCard([noInvoice, withInvoice('b', '10.00')], null)?.id).toBe('b');
    expect(pickFeaturedCard([noInvoice, aCard({ id: 'y', currentInvoice: null })], null)?.id).toBe(
      'x',
    );
  });
});

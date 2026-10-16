import { toRequestBody } from '~/modules/transactions/infra/facades/transactions-response.mapper';
import type { SplitInput } from '~/util/split';

const SPLIT: SplitInput = {
  mode: 'BPS',
  shares: [
    { personId: null, bps: 6000 },
    { personId: 'person-1', bps: 4000 },
  ],
};

describe('Contrato do rateio na compra no cartão (splitMode + shares do OpenAPI)', () => {
  it('Dado a compra com split, então o POST leva splitMode e shares junto com cartão e parcelas', () => {
    const body = toRequestBody({
      type: 'CARD_PURCHASE',
      amount: '300.00',
      date: '2026-10-05',
      description: 'TV',
      notes: null,
      cardId: 'card-1',
      categoryId: 'cat-1',
      installments: 3,
      split: SPLIT,
    });

    expect(body).toMatchObject({
      type: 'CARD_PURCHASE',
      cardId: 'card-1',
      installments: 3,
      splitMode: 'BPS',
      shares: SPLIT.shares,
    });
  });

  it('Dado a compra sem split, então o POST não leva splitMode nem shares', () => {
    const body = toRequestBody({
      type: 'CARD_PURCHASE',
      amount: '300.00',
      date: '2026-10-05',
      description: 'TV',
      notes: null,
      cardId: 'card-1',
      categoryId: 'cat-1',
      installments: 1,
    });

    expect(body).not.toHaveProperty('splitMode');
    expect(body).not.toHaveProperty('shares');
  });
});

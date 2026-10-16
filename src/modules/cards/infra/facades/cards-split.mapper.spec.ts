import { toPurchasePreviewBody } from '~/modules/cards/infra/facades/cards-response.mapper';
import type { SplitInput } from '~/util/split';

const SPLIT: SplitInput = {
  mode: 'BPS',
  shares: [
    { personId: null, bps: 6000 },
    { personId: 'person-1', bps: 4000 },
  ],
};

describe('Contrato do rateio na prévia da compra no cartão (splitMode + shares do OpenAPI)', () => {
  it('Dado a prévia com split, então o corpo usa splitMode e shares', () => {
    expect(
      toPurchasePreviewBody({
        amount: '300.00',
        installments: 3,
        date: '2026-10-05',
        split: SPLIT,
      }),
    ).toEqual({
      amount: '300.00',
      installments: 3,
      date: '2026-10-05',
      splitMode: 'BPS',
      shares: SPLIT.shares,
    });
  });

  it('Dado a prévia sem split, então o corpo tem só valor, parcelas e data', () => {
    expect(
      toPurchasePreviewBody({
        amount: '300.00',
        installments: 3,
        date: '2026-10-05',
        split: null,
      }),
    ).toEqual({ amount: '300.00', installments: 3, date: '2026-10-05' });
  });
});

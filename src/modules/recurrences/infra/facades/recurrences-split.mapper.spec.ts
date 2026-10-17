import type {
  RecurrenceInput,
  RecurrenceUpdate,
} from '~/modules/recurrences/core/types/recurrence';
import {
  toCreateRequest,
  toUpdateRequest,
} from '~/modules/recurrences/infra/facades/recurrences-response.mapper';
import type { SplitInput } from '~/util/split';

const SPLIT: SplitInput = {
  mode: 'BPS',
  shares: [
    { personId: null, bps: 6000 },
    { personId: 'person-1', bps: 4000 },
  ],
};

const EQUAL: SplitInput = {
  mode: 'EQUAL',
  shares: [{ personId: null }, { personId: 'person-1' }],
};

const AMOUNT: SplitInput = {
  mode: 'AMOUNT',
  shares: [
    { personId: null, amount: '60.00' },
    { personId: 'person-1', amount: '40.00' },
  ],
};

const cardRecurrence = (overrides: Partial<RecurrenceInput> = {}): RecurrenceInput => ({
  type: 'CARD_PURCHASE',
  amount: '100.00',
  description: 'Streaming',
  categoryId: 'cat-1',
  accountId: null,
  method: null,
  cardId: 'card-1',
  frequency: 'MONTHLY',
  interval: null,
  unit: null,
  startDate: '2026-11-05',
  endDate: null,
  maxOccurrences: null,
  ...overrides,
});

const update = (overrides: Partial<RecurrenceUpdate> = {}): RecurrenceUpdate => ({
  amount: '100.00',
  description: 'Streaming',
  categoryId: 'cat-1',
  accountId: null,
  method: null,
  cardId: 'card-1',
  endDate: null,
  version: 3,
  ...overrides,
});

describe('Contrato do rateio nos pedidos de recorrência (splitMode + shares do OpenAPI)', () => {
  describe('recorrência no cartão, criação', () => {
    it('Dado split BPS, então o corpo leva splitMode e shares com bps e personId nulo para mim', () => {
      const body = toCreateRequest(cardRecurrence({ split: SPLIT }));

      expect(body).toMatchObject({
        type: 'CARD_PURCHASE',
        cardId: 'card-1',
        splitMode: 'BPS',
        shares: [
          { personId: null, bps: 6000 },
          { personId: 'person-1', bps: 4000 },
        ],
      });
      expect(body).not.toHaveProperty('split');
    });

    it('Dado split EQUAL, então as partes vão sem bps nem amount', () => {
      const body = toCreateRequest(cardRecurrence({ split: EQUAL }));

      expect(body).toMatchObject({
        splitMode: 'EQUAL',
        shares: [{ personId: null }, { personId: 'person-1' }],
      });
      const shares = (body as { shares: object[] }).shares;
      for (const share of shares) {
        expect(share).not.toHaveProperty('bps');
        expect(share).not.toHaveProperty('amount');
      }
    });

    it('Dado split AMOUNT, então as partes levam o valor como texto decimal', () => {
      const body = toCreateRequest(cardRecurrence({ split: AMOUNT }));

      expect(body).toMatchObject({
        splitMode: 'AMOUNT',
        shares: [
          { personId: null, amount: '60.00' },
          { personId: 'person-1', amount: '40.00' },
        ],
      });
    });

    it('Dado sem divisão, então o corpo não leva splitMode nem shares (100% minha)', () => {
      const body = toCreateRequest(cardRecurrence());

      expect(body).not.toHaveProperty('splitMode');
      expect(body).not.toHaveProperty('shares');
    });

    it('Dado recorrência que não é de cartão, então o rateio é ignorado (o backend recusa com SHARES_INVALID)', () => {
      const body = toCreateRequest(
        cardRecurrence({
          type: 'EXPENSE',
          cardId: null,
          accountId: 'acc-1',
          method: 'PIX',
          split: SPLIT,
        }),
      );

      expect(body).not.toHaveProperty('splitMode');
      expect(body).not.toHaveProperty('shares');
    });
  });

  describe('recorrência no cartão, edição (vale só para o futuro)', () => {
    it('Dado split novo, então o PUT leva splitMode, shares e a version', () => {
      const body = toUpdateRequest(update({ split: SPLIT }));

      expect(body).toMatchObject({ splitMode: 'BPS', shares: SPLIT.shares, version: 3 });
    });

    it('Dado split ausente, então o PUT não toca no rateio atual', () => {
      const body = toUpdateRequest(update());

      expect(body).not.toHaveProperty('splitMode');
      expect(body).not.toHaveProperty('shares');
    });

    it('Dado split nulo (voltar a ser 100% minha), então o PUT envia shares vazio e nenhum splitMode', () => {
      const body = toUpdateRequest(update({ split: null }));

      expect(body).toMatchObject({ shares: [], version: 3 });
      expect(body).not.toHaveProperty('splitMode');
    });
  });
});

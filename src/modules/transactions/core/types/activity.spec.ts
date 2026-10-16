import { activityKind, toActivityItem } from '~/modules/transactions/core/types/activity';
import { brl } from '~/testing/accounts-testing';
import { aTransaction } from '~/testing/transactions-testing';

describe('activityKind (tabela dos 11 tipos)', () => {
  const table = [
    ['EXPENSE', null, 'EXPENSE', 'arrow-out', 'minus', 'expense'],
    ['CARD_PURCHASE', null, 'CARD_PURCHASE', 'card', 'minus', 'expense'],
    ['INCOME', null, 'INCOME', 'arrow-in', 'plus', 'income'],
    ['REFUND', null, 'REFUND', 'arrow-return', 'plus', 'neutral'],
    ['TRANSFER', null, 'TRANSFER', 'arrows-opposite', 'none', 'neutral'],
    ['INVESTMENT', 'CONTRIBUTION', 'CONTRIBUTION', 'chart', 'minus', 'neutral'],
    ['INVESTMENT', 'REDEMPTION', 'REDEMPTION', 'chart', 'plus', 'neutral'],
    ['INVOICE_PAYMENT', null, 'INVOICE_PAYMENT', 'card', 'minus', 'neutral'],
    ['LOAN_GIVEN', null, 'LOAN_GIVEN', 'person', 'minus', 'neutral'],
    ['MONEY_RECEIVED', null, 'MONEY_RECEIVED', 'person', 'plus', 'neutral'],
    ['DEBT_PAYMENT', null, 'DEBT_PAYMENT', 'person', 'minus', 'neutral'],
    ['ADJUSTMENT', 'INCREASE', 'ADJUSTMENT', 'adjust', 'plus', 'neutral'],
    ['ADJUSTMENT', 'DECREASE', 'ADJUSTMENT', 'adjust', 'minus', 'neutral'],
  ] as const;

  it.each(table)(
    'Dado %s com direção %s, quando mapeado, então rótulo %s, ícone %s, sinal %s e tom %s',
    (type, direction, labelKey, icon, sign, tone) => {
      expect(activityKind(type, direction)).toEqual({ labelKey, icon, sign, tone });
    },
  );

  it('Dado qualquer tipo que não é despesa de consumo nem receita, então o tom nunca é vermelho nem verde', () => {
    const neutral = table.filter(
      ([type]) => !['EXPENSE', 'CARD_PURCHASE', 'INCOME'].includes(type),
    );

    expect(neutral).toHaveLength(10);
    for (const [type, direction] of neutral) {
      expect(activityKind(type, direction).tone).toBe('neutral');
    }
  });

  it('Dado um tipo desconhecido, então cai em neutro com o rótulo genérico e sem sinal', () => {
    expect(activityKind('SOMETHING_NEW', null)).toEqual({
      labelKey: 'UNKNOWN',
      icon: 'generic',
      sign: 'none',
      tone: 'neutral',
    });
  });

  it('Dado aplicação ou ajuste sem direção, então não inventa sinal', () => {
    expect(activityKind('INVESTMENT', null)).toMatchObject({ sign: 'none', labelKey: 'UNKNOWN' });
    expect(activityKind('ADJUSTMENT', null).sign).toBe('none');
  });
});

describe('toActivityItem', () => {
  const asOf = '2026-10-13';

  it('Dado um valor negativo em receita, então o sinal vem do tipo e o valor segue como a API mandou', () => {
    const item = toActivityItem(aTransaction({ type: 'INCOME', amount: brl('-10.00') }), asOf);

    expect(item.sign).toBe('plus');
    expect(item.amount).toEqual(brl('-10.00'));
  });

  it('Dado a transação, então preserva id, status, tipo, data, descrição e categoria', () => {
    const item = toActivityItem(
      aTransaction({ id: 'tx-9', date: '2026-10-12', description: 'Mercado' }),
      asOf,
    );

    expect(item).toMatchObject({
      id: 'tx-9',
      status: 'ACTIVE',
      type: 'EXPENSE',
      date: '2026-10-12',
      description: 'Mercado',
      category: 'Alimentação',
      scheduled: false,
      voided: false,
    });
  });

  it('Dado data depois de asOf, então fica marcada como agendada', () => {
    expect(toActivityItem(aTransaction({ date: '2026-10-14' }), asOf).scheduled).toBe(true);
    expect(toActivityItem(aTransaction({ date: '2026-10-13' }), asOf).scheduled).toBe(false);
  });

  it('Dado estornada, então fica neutra, marcada como estornada e nunca como agendada', () => {
    const item = toActivityItem(aTransaction({ status: 'VOIDED', date: '2026-10-20' }), asOf);

    expect(item).toMatchObject({ voided: true, scheduled: false, tone: 'neutral' });
  });

  it('Dado transação sem categoria, então a categoria é nula', () => {
    expect(toActivityItem(aTransaction({ category: null }), asOf).category).toBeNull();
  });
});

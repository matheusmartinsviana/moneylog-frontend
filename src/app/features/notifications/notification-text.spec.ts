import { en } from '~/app/common/i18n/translations/en';
import { es } from '~/app/common/i18n/translations/es';
import { pt } from '~/app/common/i18n/translations/pt';
import {
  dailyMessageText,
  notificationLink,
  notificationText,
} from '~/app/features/notifications/notification-text';

describe('notificationText (chave de i18n + params, S-34)', () => {
  const invoice = {
    titleKey: 'notification.invoice.due3',
    params: { name: 'Cartão Roxo', amount: '1423.00', dueDate: '2026-10-10', daysLate: '0' },
  };

  it('Dado a chave da fatura, então o texto sai nos três idiomas com dinheiro e data formatados', () => {
    const ptText = notificationText(invoice, pt.notifications, 'pt-BR');
    expect(ptText.title).toBe('Fatura vence em 3 dias');
    expect(ptText.body).toContain('Cartão Roxo');
    expect(ptText.body).toMatch(/R\$\s?1\.423,00/);
    expect(ptText.body).toContain('10 de out');

    expect(notificationText(invoice, en.notifications, 'en').title).toBe('Invoice due in 3 days');
    expect(notificationText(invoice, es.notifications, 'es').title).toBe(
      'La factura vence en 3 días',
    );
  });

  it('Dado valores ocultos, então o montante some do texto e a data continua', () => {
    const text = notificationText(invoice, pt.notifications, 'pt-BR', true);

    expect(text.body).not.toMatch(/1\.423/);
    expect(text.body).toContain('R$ •••••');
    expect(text.body).toContain('Cartão Roxo');
  });

  it('Dado uma chave desconhecida, então mostra o texto neutro (nunca a chave crua)', () => {
    const text = notificationText(
      { titleKey: 'notification.algo.novo', params: {} },
      pt.notifications,
      'pt-BR',
    );
    expect(text).toEqual(pt.notifications.unknownMessage);
    expect(JSON.stringify(text)).not.toContain('notification.algo');
  });

  it('Dado uma chave sem o parâmetro que o texto usa, então cai no texto neutro (sem {chave} na tela)', () => {
    const text = notificationText(
      { titleKey: 'notification.invoice.due3', params: { name: 'Roxo' } },
      pt.notifications,
      'pt-BR',
    );
    expect(text).toEqual(pt.notifications.unknownMessage);
  });

  it('Dado chaves herdadas do objeto (constructor, __proto__), então não quebra e é neutro', () => {
    for (const key of ['constructor', '__proto__', 'toString']) {
      expect(notificationText({ titleKey: key, params: {} }, pt.notifications, 'pt-BR')).toEqual(
        pt.notifications.unknownMessage,
      );
    }
  });

  it('Dado o resumo do dia, então compõe saudação e números', () => {
    const text = notificationText(
      {
        titleKey: 'daily.summary',
        params: { name: 'Ana', available: '1000.50', committed7d: '200.00' },
      },
      pt.notifications,
      'pt-BR',
    );
    expect(text.body).toMatch(/^Bom dia, Ana\. Hoje você tem R\$\s?1\.000,50 disponíveis/);
  });
});

describe('dailyMessageText (T135 CA4)', () => {
  it('Dado name, available e committed7d, então "Bom dia, {nome}. Hoje você tem ... disponíveis e ... em compromissos nos próximos 7 dias."', () => {
    const text = dailyMessageText(
      { name: 'Ana', available: '3450.00', committed7d: '812.30' },
      pt.notifications,
      'pt-BR',
    );
    expect(text).toMatch(/Bom dia, Ana\./);
    expect(text).toMatch(/R\$\s?3\.450,00 disponíveis/);
    expect(text).toMatch(/R\$\s?812,30 em compromissos nos próximos 7 dias/);
  });

  it('Dado name ausente, então "Bom dia." sem nome e sem "undefined"', () => {
    const text = dailyMessageText(
      { available: '1.00', committed7d: '2.00' },
      pt.notifications,
      'pt-BR',
    );
    expect(text.startsWith('Bom dia. Hoje')).toBe(true);
    expect(text).not.toContain('undefined');
  });

  it('Dado parâmetro faltando, então o fallback é só "Bom dia."', () => {
    expect(dailyMessageText({ available: '1.00' }, pt.notifications, 'pt-BR')).toBe('Bom dia.');
    expect(dailyMessageText({}, pt.notifications, 'pt-BR')).toBe('Bom dia.');
    expect(dailyMessageText({ name: 'Ana' }, pt.notifications, 'pt-BR')).toBe('Bom dia, Ana.');
  });

  it('Dado meta com prazo, então acrescenta a meta com o progresso formatado', () => {
    const text = dailyMessageText(
      {
        available: '1.00',
        committed7d: '2.00',
        goalName: 'Viagem',
        goalProgress: '0.4250',
      },
      pt.notifications,
      'pt-BR',
    );
    expect(text).toContain('A meta Viagem está em 42,5%.');
  });
});

describe('notificationLink', () => {
  it.each([
    ['CARD', '/cards/abc'],
    ['DEBT', '/debts/abc'],
    ['GOAL', '/goals/abc'],
    ['RECURRENCE', '/planning'],
    ['REMINDER', '/notifications'],
    ['INVOICE', '/cards/invoices/abc'],
    ['USER', '/'],
  ] as const)('Dado a referência %s, então leva a %s', (type, path) => {
    expect(notificationLink({ ref: { type, id: 'abc' } })).toBe(path);
  });
});

describe('notificationText, alertas de 2.32.0', () => {
  it('Dado o custo de dinheiro no cartão, então mostra a taxa em porcentagem e a parcela', () => {
    const text = notificationText(
      {
        titleKey: 'notification.cardCashOut.cost',
        params: { monthlyRateBps: '199', installmentAmount: '350.00', installments: '6' },
      },
      pt.notifications,
      'pt-BR',
    );

    expect(text.title).toBe('Dinheiro no cartão tem custo');
    expect(text.body).toContain('1,99');
    expect(text.body).toMatch(/R\$\s?350,00/);
    expect(text.body).toContain('6 parcelas');
  });

  it('Dado o mês negativo, então formata a competência e o valor com a moeda do dado', () => {
    const text = notificationText(
      {
        titleKey: 'notification.month.negative',
        params: { competence: '2026-11', surplus: '-120.50' },
      },
      pt.notifications,
      'pt-BR',
    );

    expect(text.body).toContain('novembro');
    expect(text.body).toMatch(/R\$\s?120,50/);
  });

  it('Dado a assinatura sem uso, então sai nos três idiomas', () => {
    const notification = {
      titleKey: 'notification.subscription.unused',
      params: { name: 'Streaming', days: '75' },
    };

    expect(notificationText(notification, pt.notifications, 'pt-BR').body).toContain('75 dias');
    expect(notificationText(notification, en.notifications, 'en').body).toContain('75 days');
    expect(notificationText(notification, es.notifications, 'es').body).toContain('75 días');
  });

  it('Dado parâmetro que falta, então cai no texto neutro e nunca mostra chaves soltas', () => {
    const text = notificationText(
      { titleKey: 'notification.thirdParty.overdue', params: {} },
      pt.notifications,
      'pt-BR',
    );

    expect(text).toEqual(pt.notifications.unknownMessage);
  });

  it('Dado alerta de assinatura, então o link vai para as assinaturas', () => {
    expect(
      notificationLink({ kind: 'SUBSCRIPTION_UNUSED', ref: { type: 'RECURRENCE', id: 'r-1' } }),
    ).toBe('/planning/subscriptions');
  });

  it('Dado alerta ligado a uma movimentação ou compromisso, então o link abre o registro', () => {
    expect(notificationLink({ ref: { type: 'TRANSACTION', id: 't-1' } })).toBe('/transactions/t-1');
    expect(notificationLink({ ref: { type: 'COMMITMENT', id: 'c-1' } })).toBe(
      '/planning/commitments/c-1',
    );
  });
});

describe('notificationText, os dez alertas novos com os parâmetros reais do backend', () => {
  const cases = [
    [
      'notification.invoice.autodebitOff',
      { cardName: 'Cartão A', dueDate: '2026-11-05', amount: '1283.00' },
    ],
    ['notification.month.negative', { competence: '2026-11', surplus: '-80.00' }],
    ['notification.debt.beforeFinancing', { amount: '3000.00', installments: '12' }],
    [
      'notification.cardCashOut.cost',
      { monthlyRateBps: '199', installmentAmount: '350.00', installments: '6' },
    ],
    ['notification.subscription.overlap', { group: 'video' }],
    ['notification.subscription.unused', { name: 'Streaming', days: '75' }],
    ['notification.subscription.weekly', { name: 'Streaming' }],
    ['notification.thirdParty.overdue', { personName: 'Ana', amount: '120.00' }],
    ['notification.balance.belowRealEstate', { balance: '500.00', due: '2000.00' }],
    [
      'notification.document.divergence',
      { label: 'Fatura Roxo', informed: '1283.00', documented: '1271.00', difference: '12.00' },
    ],
  ] as const;

  it.each(cases)(
    'Dado %s, então os três idiomas montam título e corpo sem placeholder',
    (key, params) => {
      for (const [copy, locale] of [
        [pt.notifications, 'pt-BR'],
        [en.notifications, 'en'],
        [es.notifications, 'es'],
      ] as const) {
        const text = notificationText({ titleKey: key, params }, copy, locale);

        expect(text).not.toEqual(copy.unknownMessage);
        expect(`${text.title} ${text.body}`).not.toMatch(/\{\w+\}/);
      }
    },
  );

  it.each(cases)('Dado %s e valores ocultos, então nenhum montante aparece', (key, params) => {
    const text = notificationText({ titleKey: key, params }, pt.notifications, 'pt-BR', true);

    expect(`${text.title} ${text.body}`).not.toMatch(/R\$\s?[\d-]/);
  });
});

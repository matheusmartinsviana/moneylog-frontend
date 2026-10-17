import { render, screen } from '@testing-library/angular';

import {
  STATUS_TAG_ICON,
  StatusTagComponent,
  StatusTagKind,
} from '~/app/common/components/status-tag/status-tag.component';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';

const LABELS: Readonly<Record<StatusTagKind, string>> = {
  EXPENSE: 'Despesa',
  CARD_PURCHASE: 'Compra no cartão',
  INCOME: 'Receita',
  REFUND: 'Reembolso',
  TRANSFER: 'Transferência',
  CONTRIBUTION: 'Aplicação',
  REDEMPTION: 'Resgate',
  INVOICE_PAYMENT: 'Pagamento de fatura',
  LOAN_GIVEN: 'Empréstimo concedido',
  MONEY_RECEIVED: 'Dinheiro recebido',
  DEBT_PAYMENT: 'Pagamento de dívida',
  ADJUSTMENT: 'Ajuste',
  UNKNOWN: 'Movimentação',
  SCHEDULED: 'Agendada',
  VOIDED: 'Estornada',
};

describe('StatusTagComponent', () => {
  it.each(Object.keys(LABELS) as StatusTagKind[])(
    'Dado o tipo %s, então mostra rótulo e ícone próprios',
    async (kind) => {
      const { container } = await render(StatusTagComponent, {
        inputs: { kind, cy: 'st' },
        providers: [provideI18nTesting('pt')],
      });

      const tag = screen.getByTestId('st');
      expect(tag).toHaveTextContent(LABELS[kind]);
      expect(tag.querySelector(`[data-icon="${STATUS_TAG_ICON[kind]}"]`)).not.toBeNull();
      const violations = await axeViolations(container);
      expect(violations, describeViolations(violations)).toEqual([]);
    },
  );

  it('Dado o tom, então ele vai ao atributo e o padrão é neutro', async () => {
    await render(StatusTagComponent, {
      inputs: { kind: 'EXPENSE', cy: 'st' },
      providers: [provideI18nTesting('pt')],
    });
    expect(screen.getByTestId('st')).toHaveAttribute('data-tone', 'neutral');
  });

  it.each([
    ['EXPENSE', 'expense', 'expense'],
    ['INCOME', 'income', 'income'],
    ['REFUND', 'income', 'neutral'],
    ['REFUND', 'expense', 'neutral'],
    ['EXPENSE', 'income', 'neutral'],
    ['TRANSFER', 'expense', 'neutral'],
    ['TRANSFER', 'income', 'neutral'],
    ['CONTRIBUTION', 'expense', 'neutral'],
    ['REDEMPTION', 'income', 'neutral'],
    ['INVOICE_PAYMENT', 'expense', 'neutral'],
    ['LOAN_GIVEN', 'expense', 'neutral'],
    ['DEBT_PAYMENT', 'income', 'neutral'],
    ['ADJUSTMENT', 'expense', 'neutral'],
  ] as const)(
    'Dado o tipo %s pedindo o tom %s, então o tom efetivo é %s',
    async (kind, tone, expected) => {
      await render(StatusTagComponent, {
        inputs: { kind, tone, cy: 'st' },
        providers: [provideI18nTesting('pt')],
      });
      expect(screen.getByTestId('st')).toHaveAttribute('data-tone', expected);
    },
  );
});

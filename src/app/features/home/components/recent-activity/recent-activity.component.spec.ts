import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ValuesVisibilityService } from '~/app/common/services/values-visibility.service';
import { RecentActivityComponent } from '~/app/features/home/components/recent-activity/recent-activity.component';
import type { RecentActivityState } from '~/modules/transactions/core/facades/recent-activity.facade';
import { toActivityItem } from '~/modules/transactions/core/types/activity';
import type { Transaction } from '~/modules/transactions/core/types/transaction';
import { brl } from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';
import { aTransaction } from '~/testing/transactions-testing';
import { problemOf } from '~/util/api/problem';

const ASOF = '2026-10-13';

const ready = (...overrides: Partial<Transaction>[]): RecentActivityState => ({
  status: 'ready',
  items: overrides.map((o, i) => toActivityItem(aTransaction({ id: `tx-${i}`, ...o }), ASOF)),
});

async function setup(state: RecentActivityState, extra: unknown[] = []) {
  const view = await render(RecentActivityComponent, {
    inputs: { state },
    providers: [provideI18nTesting('pt'), provideRouter([]), ...(extra as [])],
  });
  return view;
}

const CASES: readonly [string, Partial<Transaction>, string, string, string, string][] = [
  ['EXPENSE', { type: 'EXPENSE' }, 'Despesa', '−', 'expense', 'arrowOut'],
  ['CARD_PURCHASE', { type: 'CARD_PURCHASE' }, 'Compra no cartão', '−', 'expense', 'cards'],
  ['INCOME', { type: 'INCOME' }, 'Receita', '+', 'income', 'arrowIn'],
  ['REFUND', { type: 'REFUND' }, 'Reembolso', '+', 'neutral', 'arrowReturn'],
  ['TRANSFER', { type: 'TRANSFER' }, 'Transferência', '', 'neutral', 'arrowsOpposite'],
  [
    'CONTRIBUTION',
    { type: 'INVESTMENT', direction: 'CONTRIBUTION' },
    'Aplicação',
    '−',
    'neutral',
    'chart',
  ],
  [
    'REDEMPTION',
    { type: 'INVESTMENT', direction: 'REDEMPTION' },
    'Resgate',
    '+',
    'neutral',
    'chart',
  ],
  ['INVOICE_PAYMENT', { type: 'INVOICE_PAYMENT' }, 'Pagamento de fatura', '−', 'neutral', 'cards'],
  ['LOAN_GIVEN', { type: 'LOAN_GIVEN' }, 'Empréstimo concedido', '−', 'neutral', 'person'],
  ['MONEY_RECEIVED', { type: 'MONEY_RECEIVED' }, 'Dinheiro recebido', '+', 'neutral', 'person'],
  ['DEBT_PAYMENT', { type: 'DEBT_PAYMENT' }, 'Pagamento de dívida', '−', 'neutral', 'person'],
  [
    'ADJUSTMENT+',
    { type: 'ADJUSTMENT', direction: 'INCREASE' },
    'Ajuste',
    '+',
    'neutral',
    'adjust',
  ],
  [
    'ADJUSTMENT-',
    { type: 'ADJUSTMENT', direction: 'DECREASE' },
    'Ajuste',
    '−',
    'neutral',
    'adjust',
  ],
  [
    'UNKNOWN',
    { type: 'SOMETHING_NEW' as Transaction['type'] },
    'Movimentação',
    '',
    'neutral',
    'generic',
  ],
];

describe('RecentActivityComponent', () => {
  it.each(CASES)(
    'Dado o tipo %s, quando renderiza, então mostra rótulo, ícone, sinal e tom da tabela',
    async (_name, overrides, label, sign, tone, icon) => {
      await setup(ready(overrides));

      const row = screen.getByTestId('home-recent-item');
      expect(within(row).getByTestId('home-recent-kind')).toHaveTextContent(label);
      expect(row.querySelector(`[data-icon="${icon}"]`)).not.toBeNull();
      expect(within(row).getByTestId('home-recent-amount')).toHaveAttribute('data-tone', tone);
      const signEl = within(row).queryByTestId('home-recent-sign');
      if (sign) expect(signEl).toHaveTextContent(sign);
      else expect(signEl).toBeNull();
    },
  );

  it('Dado qualquer tipo que não seja despesa de consumo, então o tom nunca é vermelho', async () => {
    const neutral = CASES.filter(([, , , , tone]) => tone === 'neutral').map(([, o]) => o);
    await setup(ready(...neutral));

    for (const el of screen.getAllByTestId('home-recent-amount')) {
      expect(el).not.toHaveAttribute('data-tone', 'expense');
    }
  });

  it('Dado valor com sinal vindo negativo da API, então o sinal exibido vem do tipo e o valor sai sem menos', async () => {
    await setup(ready({ type: 'INCOME', amount: brl('-10.00') }));

    const amount = screen.getByTestId('home-recent-amount');
    expect(within(amount).getByTestId('home-recent-sign')).toHaveTextContent('+');
    expect(within(amount).getByTestId('money-value')).toHaveTextContent('R$ 10,00');
  });

  it('Dado movimentação estornada, então mostra o selo, o valor riscado e tom neutro', async () => {
    await setup(ready({ type: 'EXPENSE', status: 'VOIDED' }));

    expect(screen.getByTestId('home-recent-badge')).toHaveTextContent('Estornada');
    const amount = screen.getByTestId('home-recent-amount');
    expect(amount).toHaveClass('is-voided');
    expect(amount).toHaveAttribute('data-tone', 'neutral');
  });

  it('Dado movimentação com data depois de asOf, então mostra o selo de agendada', async () => {
    await setup(ready({ date: '2026-10-20' }));

    expect(screen.getByTestId('home-recent-badge')).toHaveTextContent('Agendada');
  });

  it('Dado agendada de despesa, então o nome acessível do link traz descrição, tipo, sinal, valor, categoria, data e selo', async () => {
    await setup(
      ready({
        type: 'EXPENSE',
        description: 'Seguro do celular',
        amount: brl('90.00'),
        date: '2026-10-20',
      }),
    );

    const link = screen.getByRole('link', {
      name: /^Seguro do celular\s*Despesa\s+Alimentação\s+20 de out\.\s*Agendada\s*Saída\s*R\$\s*90,00$/,
    });
    expect(link).not.toHaveAttribute('aria-label');
  });

  it('Dado estornada, então o nome acessível do link inclui o selo Estornada', async () => {
    await setup(ready({ type: 'EXPENSE', status: 'VOIDED', description: 'Geladeira' }));

    expect(screen.getByRole('link', { name: /Geladeira.*Estornada/s })).toBeInTheDocument();
  });

  it('Dado compra no cartão parcelada, então a linha mostra a indicação de parcelas', async () => {
    await setup(
      ready({
        type: 'CARD_PURCHASE',
        installments: Array.from({ length: 6 }, (_, i) => ({
          number: i + 1,
          total: 6,
          amount: brl('200.00'),
          competence: '2026-10',
          invoiceId: 'inv-1',
          invoiceReferenceMonth: '2026-10',
          invoiceDueDate: '2026-10-20',
          status: 'PENDING' as const,
          lateEntry: false,
        })),
      }),
    );

    expect(screen.getByTestId('home-recent-installments')).toHaveTextContent('6x');
  });

  it('Dado despesa à vista, então não mostra indicação de parcelas', async () => {
    await setup(ready({ type: 'EXPENSE' }));

    expect(screen.queryByTestId('home-recent-installments')).toBeNull();
  });

  it('Dado movimentação realizada e ativa, então não mostra selo', async () => {
    await setup(ready({}));

    expect(screen.queryByTestId('home-recent-badge')).toBeNull();
  });

  it('Dado categoria nula, então mostra "Sem categoria"', async () => {
    await setup(ready({ category: null }));

    expect(screen.getByTestId('home-recent-category')).toHaveTextContent('Sem categoria');
  });

  it('Dado clique na linha, então navega para o detalhe da transação', async () => {
    const { fixture } = await setup(ready({ id: 'abc' }));
    const router = fixture.debugElement.injector.get(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    await userEvent.click(screen.getByTestId('home-recent-link'));

    expect(String(navigate.mock.calls[0]?.[0])).toBe('/transactions/abc');
  });

  it('Dado a linha focada, quando aperta Enter, então navega para o detalhe', async () => {
    const { fixture } = await setup(ready({ id: 'xyz' }));
    const router = fixture.debugElement.injector.get(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    screen.getByTestId('home-recent-link').focus();
    await userEvent.keyboard('{Enter}');

    expect(String(navigate.mock.calls[0]?.[0])).toBe('/transactions/xyz');
  });

  it('Dado zero movimentações, então mostra o estado vazio com ação de registrar', async () => {
    await setup({ status: 'empty' });

    expect(screen.getByTestId('home-recent-empty')).toBeInTheDocument();
    expect(screen.getByText('Registrar movimentação').closest('a')).toHaveAttribute(
      'href',
      '/quick-add',
    );
  });

  it('Dado carregando, então avisa que está carregando', async () => {
    await setup({ status: 'loading' });

    expect(screen.getByTestId('home-recent-loading')).toBeInTheDocument();
  });

  it('Dado erro, quando aciona tentar de novo, então emite retry', async () => {
    const retry = vi.fn();
    await render(RecentActivityComponent, {
      inputs: { state: { status: 'error', problem: problemOf(new Error('x')) } },
      on: { retry },
      providers: [provideI18nTesting('pt'), provideRouter([])],
    });

    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('Dado valores ocultos, então o valor real não está no DOM', async () => {
    const { container } = await setup(ready({ amount: brl('1234.56') }), [
      { provide: ValuesVisibilityService, useValue: { hidden: signal(true) } },
    ]);

    expect(container.textContent).not.toContain('1.234,56');
    expect(screen.getByTestId('money-value')).toHaveAttribute('data-masked', 'true');
  });

  it('Dado a lista, então não tem violações de acessibilidade', async () => {
    const { container } = await setup(
      ready({ type: 'EXPENSE' }, { type: 'TRANSFER' }, { status: 'VOIDED' }),
    );

    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});

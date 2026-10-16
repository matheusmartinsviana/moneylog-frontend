import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { pt } from '~/app/common/i18n/translations/pt';
import { ValuesVisibilityService } from '~/app/common/services/values-visibility.service';
import { ChartPanelComponent } from '~/app/features/home/components/chart-panel/chart-panel.component';
import type { SpendingOverviewState } from '~/modules/reports/core/facades/spending-overview.facade';
import { REPORT_PERIODS, type ReportPeriod } from '~/modules/reports/core/types/reports';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';
import { anIncomeExpenseSeries } from '~/testing/reports-testing';

const ready = (): SpendingOverviewState => ({ status: 'ready', data: anIncomeExpenseSeries() });
const problem = (status: number) => ({
  status,
  code: 'X',
  fieldErrors: [],
  traceId: null,
  retryAfterSeconds: null,
});

async function setup(state: SpendingOverviewState = ready(), period: ReportPeriod = 'D7') {
  const periodChange = vi.fn();
  const retry = vi.fn();
  const result = await render(ChartPanelComponent, {
    providers: [provideI18nTesting('pt'), provideRouter([])],
    inputs: { state, period, periods: REPORT_PERIODS },
    on: { periodChange, retry },
  });
  return { ...result, periodChange, retry };
}

describe('ChartPanelComponent', () => {
  afterEach(() => {
    localStorage.clear();
    document.body.replaceChildren();
  });

  it('Dado a série, Quando renderiza, Então a série vermelha se chama Despesas e há totais e resumo para leitor de tela', async () => {
    await setup();

    expect(screen.getByTestId('home-chart-legend')).toHaveTextContent(pt.home.chart.expenses);
    expect(screen.getByTestId('home-chart-legend')).not.toHaveTextContent('Saídas');
    expect(screen.getByTestId('home-chart-totals')).toHaveTextContent(pt.home.chart.totalExpenses);
    const img = screen.getByRole('img');
    expect(img.getAttribute('aria-label')).toContain('7 dias');
    expect(img.getAttribute('aria-label')).toMatch(/3\.000,00/);
    expect(img.getAttribute('aria-label')).toMatch(/250,00/);
  });

  it('Dado as duas séries em área, Então diferem por traço e pela legenda, sem marcadores sobre a linha', async () => {
    await setup();

    expect(screen.queryAllByTestId('home-chart-mark-income')).toHaveLength(0);
    expect(screen.queryAllByTestId('home-chart-direct-income')).toHaveLength(0);
    expect(screen.getByTestId('home-chart-line-expenses')).toHaveClass('lc__line--secondary');
    expect(screen.getByTestId('home-chart-line-income')).not.toHaveClass('lc__line--secondary');
    expect(screen.getByTestId('home-chart-legend')).toHaveTextContent(pt.home.chart.income);
    expect(screen.getByTestId('home-chart-legend')).toHaveTextContent(pt.home.chart.expenses);
  });

  it('Dado o foco por teclado no gráfico, Quando usa a seta, Então o tooltip mostra data, métrica e valor e Esc fecha', async () => {
    const user = userEvent.setup();
    await setup();

    screen.getByTestId('home-chart-plot').focus();
    await user.keyboard('{ArrowRight}');
    const tip = screen.getByTestId('home-chart-tooltip');
    expect(tip).toHaveTextContent('4 de outubro de 2026');
    expect(tip).toHaveTextContent(pt.home.chart.expenses);
    expect(tip).toHaveTextContent('R$');
    await user.keyboard('{Escape}');
    expect(screen.queryByTestId('home-chart-tooltip')).toBeNull();
  });

  it('Dado valores ocultos, Então resumo, totais, tooltip e tabela não vazam o valor', async () => {
    const user = userEvent.setup();
    await render(ChartPanelComponent, {
      providers: [provideI18nTesting('pt'), provideRouter([])],
      inputs: { state: ready(), period: 'D7' },
    });
    const { TestBed } = await import('@angular/core/testing');
    TestBed.inject(ValuesVisibilityService).set(true);

    screen.getByTestId('home-chart-plot').focus();
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByTestId('home-chart-table-toggle'));

    const body = document.body.textContent ?? '';
    expect(body).not.toMatch(/3\.000/);
    expect(body).not.toMatch(/250,00/);
    expect(screen.getByRole('img').getAttribute('aria-label')).not.toMatch(/\d{2,}[.,]\d{2}/);
    expect(
      within(screen.getByTestId('home-chart-totals')).getAllByText(pt.glass.values.hidden),
    ).toHaveLength(2);
  });

  it('Dado a tabela equivalente, Quando aciona Ver como tabela, Então mostra período, receitas e despesas', async () => {
    const user = userEvent.setup();
    await setup();

    await user.click(screen.getByRole('button', { name: pt.charts.viewAsTable }));

    const table = screen.getByRole('table');
    expect(within(table).getByRole('columnheader', { name: pt.home.chart.expenses })).toBeVisible();
    expect(within(table).getAllByRole('row')).toHaveLength(8);
  });

  it('Dado série só com zeros, Então mostra Sem movimentações no período', async () => {
    const zero = anIncomeExpenseSeries({
      points: [
        {
          periodStart: '2026-10-04',
          periodEnd: '2026-10-04',
          partial: false,
          income: { amount: '0.00', currency: 'BRL' },
          expenses: { amount: '0.00', currency: 'BRL' },
          net: { amount: '0.00', currency: 'BRL' },
        },
      ],
    });
    await setup({ status: 'ready', data: zero });

    expect(screen.getByTestId('home-chart-empty')).toHaveTextContent(pt.home.chart.empty);
  });

  it('Dado o estado vazio, Então oferece a ação de ver transações', async () => {
    await setup({ status: 'empty', data: anIncomeExpenseSeries({ points: [] }) });

    expect(screen.getByRole('link', { name: pt.home.chart.emptyAction })).toHaveAttribute(
      'href',
      '/transactions',
    );
  });

  it('Dado carregando, Então anuncia o carregamento', async () => {
    await setup({ status: 'loading' });

    expect(screen.getByRole('status')).toHaveTextContent(pt.home.chart.loading);
  });

  it('Dado erro, Quando clica em tentar de novo, Então emite retry', async () => {
    const user = userEvent.setup();
    const { retry } = await setup({ status: 'error', problem: problem(500) });

    await user.click(screen.getByRole('button', { name: pt.home.chart.retry }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('Dado 403, Então mostra sem permissão e não oferece tentar de novo', async () => {
    await setup({ status: 'error', problem: problem(403) });

    expect(screen.getByTestId('home-chart-forbidden')).toHaveTextContent(pt.home.chart.forbidden);
    expect(screen.queryByTestId('home-chart-retry')).toBeNull();
  });

  it('Dado os períodos do contrato, Então oferece D7, D30, M3 e M12 e emite a troca', async () => {
    const user = userEvent.setup();
    const { periodChange } = await setup();

    const group = screen.getByRole('radiogroup', { name: pt.home.chart.periodLabel });
    expect(within(group).getAllByRole('radio')).toHaveLength(4);
    await user.click(within(group).getByRole('radio', { name: pt.home.chart.periods.M3 }));

    expect(periodChange).toHaveBeenCalledWith('M3');
  });

  it('Dado o painel pronto, Então não tem violações de acessibilidade', async () => {
    const { container } = await setup();

    expect(describeViolations(await axeViolations(container))).toBe('');
  });
});

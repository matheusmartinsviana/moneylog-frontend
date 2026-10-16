import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { AnalyticsPanelComponent } from '~/app/features/home/components/analytics-panel/analytics-panel.component';
import type { MonthlySummaryState } from '~/modules/monthly-summary/core/facades/monthly-summary.facade';
import type { MonthlySummary } from '~/modules/monthly-summary/core/types/monthly-summary';
import { brl } from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { aSummary } from '~/testing/etapa5-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';

const ready = (overrides: Partial<MonthlySummary> = {}): MonthlySummaryState => ({
  status: 'ready',
  data: aSummary(overrides),
});

async function setup(summary: MonthlySummaryState) {
  const user = userEvent.setup();
  const view = await render(AnalyticsPanelComponent, {
    inputs: { summary },
    providers: [provideI18nTesting('pt'), provideRouter([])],
  });
  return { user, view };
}

describe('AnalyticsPanelComponent', () => {
  it('Dado falha em summaries, Quando renderiza, Então só o painel mostra erro e Tentar novamente emite retry', async () => {
    const { user, view } = await setup({
      status: 'error',
      problem: {
        status: 500,
        code: 'INTERNAL',
        fieldErrors: [],
        traceId: null,
        retryAfterSeconds: null,
      },
    });
    const retry = vi.fn();
    view.fixture.componentInstance.retry.subscribe(retry);

    await user.click(screen.getByRole('button'));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('Dado carregando, Quando renderiza, Então anuncia o carregamento', async () => {
    await setup({ status: 'loading' });

    expect(screen.getByTestId('home-analytics-loading')).toBeInTheDocument();
  });

  it('Dado mês sem movimentações, Quando renderiza, Então mostra vazio com ação de registrar', async () => {
    await setup(
      ready({
        income: brl('0.00'),
        expenses: brl('0.00'),
        investments: brl('0.00'),
        net: brl('0.00'),
      }),
    );

    expect(screen.getByText('Ainda não há movimentações neste mês.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nova transação' })).toHaveAttribute(
      'href',
      '/quick-add',
    );
  });

  it('Dado o painel pronto, Quando auditado, Então não há violações de acessibilidade', async () => {
    const { view } = await setup(ready());
    expect(describeViolations(await axeViolations(view.container))).toBe('');
  });
});

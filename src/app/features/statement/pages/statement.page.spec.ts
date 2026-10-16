import { provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER, of } from 'rxjs';

import { StatementPage } from '~/app/features/statement/pages/statement.page';
import { failWith } from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';
import {
  aStatement,
  aStatementMonth,
  OwnerStatementGatewayStub,
  provideOwnerStatementStub,
} from '~/testing/owner-statement-testing';

vi.setConfig({ testTimeout: 30_000 });

const brl = (amount: string) => ({ amount, currency: 'BRL' });

async function setup(gateway = new OwnerStatementGatewayStub(), from?: string) {
  const result = await render(StatementPage, {
    inputs: { from },
    providers: [provideI18nTesting('pt'), provideRouter([]), provideOwnerStatementStub(gateway)],
  });
  await result.fixture.whenStable();
  result.fixture.detectChanges();
  return { ...result, gateway };
}

const text = (el: HTMLElement) =>
  el.textContent
    ?.replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();

describe('StatementPage', () => {
  it('Dado carregando, então mostra o esqueleto com status acessível e nenhum valor', async () => {
    const gateway = new OwnerStatementGatewayStub();
    gateway.result$ = NEVER;
    await setup(gateway);

    expect(screen.getByTestId('statement-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('statement-table')).not.toBeInTheDocument();
  });

  it('Dado o resumo de novembro, então pede ao backend a janela e mostra os valores sem recalcular', async () => {
    const { gateway } = await setup(new OwnerStatementGatewayStub(), '2026-11');

    expect(gateway.queries).toEqual([{ from: '2026-11', months: 3 }]);
    expect(text(screen.getByTestId('statement-opening-balance'))).toContain('R$ 1.000,00');
    expect(text(screen.getByTestId('statement-surplus-2026-11'))).toContain('R$ 2.000,00');
    expect(text(screen.getByTestId('statement-row-end-balance'))).toContain('R$ 3.000,00');
    expect(text(screen.getByTestId('statement-row-outflow'))).toContain('R$ 4.000,00');
    expect(text(screen.getByTestId('statement-row-real-estate'))).toContain('R$ 1.000,00');
  });

  it('Dado a competência sem o parâmetro, então pede ao backend a janela padrão', async () => {
    const { gateway } = await setup();

    expect(gateway.queries).toEqual([{ from: null, months: 3 }]);
  });

  it('Dado parâmetro from inválido, então não o envia ao backend', async () => {
    const { gateway } = await setup(new OwnerStatementGatewayStub(), '2026-13');

    expect(gateway.queries).toEqual([{ from: null, months: 3 }]);
  });

  it('Dado mês com sobra negativa, então marca a coluna, mostra o sinal e anuncia o mês', async () => {
    const gateway = new OwnerStatementGatewayStub();
    gateway.result$ = of(
      aStatement({
        months: [
          aStatementMonth({
            competence: '2026-11',
            negative: true,
            surplus: brl('-800.00'),
            endBalance: brl('200.00'),
          }),
        ],
        negativeMonths: ['2026-11'],
      }),
    );
    await setup(gateway);

    const cell = screen.getByTestId('statement-surplus-2026-11');
    expect(cell).toHaveAttribute('data-negative', 'true');
    expect(text(cell)).toContain('−R$ 800,00');
    expect(text(cell)).toContain('Sobra negativa');
    expect(screen.getByTestId('statement-announcement')).toHaveTextContent(
      /Atenção, meses com sobra negativa: .*novembro/i,
    );
  });

  it('Dado nenhum mês negativo, então o anúncio diz que todos estão positivos', async () => {
    await setup();

    expect(screen.getByTestId('statement-announcement')).toHaveTextContent(
      'Nenhum mês com sobra negativa neste período.',
    );
    expect(screen.getByTestId('statement-surplus-2026-11')).toHaveAttribute(
      'data-negative',
      'false',
    );
  });

  it('Dado os avisos do backend, então traduz cada código e oferece registrar renda só quando falta salário', async () => {
    const gateway = new OwnerStatementGatewayStub();
    gateway.result$ = of(
      aStatement({
        warnings: [
          { code: 'OPENING_BALANCE_NOT_PROJECTED', competence: null },
          { code: 'INCOME_MISSING', competence: '2026-11' },
          { code: 'REAL_ESTATE_SHARE_UNDEFINED', competence: '2026-11' },
          { code: 'TAX_TABLE_UNAVAILABLE', competence: '2026-11' },
          { code: 'ALGO_NOVO', competence: null },
        ],
      }),
    );
    await setup(gateway);

    const items = screen.getAllByTestId('statement-warning');
    expect(items).toHaveLength(5);
    expect(text(items[0]!)).toContain('O saldo de partida é o que está nas suas contas hoje');
    expect(text(items[1]!)).toContain('Não encontramos salário previsto para novembro');
    expect(within(items[1]!).getByTestId('statement-add-income')).toHaveAttribute(
      'href',
      '/quick-add',
    );
    expect(text(items[2]!)).toContain('cota do imóvel em novembro');
    expect(text(items[3]!)).toContain('Não há tabela fiscal vigente para novembro');
    expect(text(items[4]!)).toContain('Há um aviso neste cálculo para este período');
    expect(screen.getAllByTestId('statement-add-income')).toHaveLength(1);
  });

  it('Dado nenhum aviso, então a seção de avisos não aparece', async () => {
    await setup();

    expect(screen.queryByTestId('statement-warnings')).not.toBeInTheDocument();
  });

  it('Dado o toggle da fatura cheia, então troca só a linha dos cartões e a sobra continua a do backend', async () => {
    await setup();

    const cards = screen.getByTestId('statement-row-cards');
    expect(text(cards)).toContain('Cartões, minha parte');
    expect(text(cards)).toContain('R$ 1.500,00');
    expect(screen.queryByTestId('statement-gross-note')).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId('statement-gross'));

    expect(text(cards)).toContain('Cartões, fatura cheia');
    expect(text(cards)).toContain('R$ 2.500,00');
    expect(screen.getByTestId('statement-gross-note')).toBeInTheDocument();
    expect(text(screen.getByTestId('statement-surplus-2026-11'))).toContain('R$ 2.000,00');
    expect(text(screen.getByTestId('statement-row-outflow'))).toContain('R$ 4.000,00');
  });

  it('Dado renda estimada e recebida, então rotula cada item de salário', async () => {
    await setup();

    const items = text(screen.getByTestId('statement-row-income-items'))!;
    expect(items).toContain('Previsto');
    expect(items).toContain('estimado');
    expect(items).toContain('R$ 2.400,00');
    expect(items).toContain('R$ 3.600,00');
  });

  it('Dado parcela de consignado descontada em folha, então a mostra; com valor zero, esconde', async () => {
    const gateway = new OwnerStatementGatewayStub();
    const base = aStatementMonth();
    gateway.result$ = of(
      aStatement({
        months: [
          { ...base, income: { ...base.income, appliedToDebt: brl('450.00') } },
          {
            ...base,
            competence: '2026-12',
            income: { ...base.income, appliedToDebt: brl('0.00') },
          },
        ],
      }),
    );
    await setup(gateway);

    const row = text(screen.getByTestId('statement-row-income-items'))!;
    expect(row).toContain('Parcela do consignado descontada em folha: R$ 450,00');
    expect(row.match(/Parcela do consignado/g)).toHaveLength(1);
  });

  it('Dado valores a receber e assinaturas da empresa, então ficam numa seção separada da sobra', async () => {
    await setup();

    const row = screen.getByTestId('statement-receivable-2026-11');
    expect(text(row)).toContain('R$ 700,00');
    expect(text(row)).toContain('R$ 50,00');
    expect(screen.getByTestId('statement-table')).not.toContainElement(row);
  });

  it('Dado resumo sem meses, então mostra o estado vazio com a ação de registrar renda', async () => {
    const gateway = new OwnerStatementGatewayStub();
    gateway.result$ = of(aStatement({ months: [] }));
    await setup(gateway);

    expect(screen.getByText('Ainda não há resumo para mostrar')).toBeInTheDocument();
    expect(screen.queryByTestId('statement-table')).not.toBeInTheDocument();
  });

  it('Dado erro 500, quando tento de novo, então recarrega e mostra o resumo', async () => {
    const gateway = new OwnerStatementGatewayStub();
    gateway.result$ = failWith(500, 'INTERNAL');
    const { fixture } = await setup(gateway);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    gateway.result$ = of(aStatement());
    await userEvent.click(screen.getByRole('button', { name: /tentar de novo/i }));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.queries).toHaveLength(2);
    expect(screen.getByTestId('statement-table')).toBeInTheDocument();
  });

  it('Dado a tela pronta, então não tem violações de acessibilidade', async () => {
    const { container } = await setup();

    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});

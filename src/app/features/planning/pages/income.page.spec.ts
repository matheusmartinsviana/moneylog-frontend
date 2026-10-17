import { provideRouter } from '@angular/router';
import { render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER, of } from 'rxjs';

import { IncomePage } from '~/app/features/planning/pages/income.page';
import { failWith } from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { DebtsGatewayStub, provideDebtsStub } from '~/testing/debts-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';
import {
  anIncomePreview,
  anIncomeProfile,
  IncomeGatewayStub,
  provideIncomeStub,
} from '~/testing/income-testing';
import { todayIso } from '~/util/date';

vi.setConfig({ testTimeout: 30_000 });

const brl = (amount: string) => ({ amount, currency: 'BRL' });

const text = (el: HTMLElement) =>
  el.textContent
    ?.replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();

async function setup(gateway = new IncomeGatewayStub()) {
  const result = await render(IncomePage, {
    providers: [
      provideI18nTesting('pt'),
      provideRouter([]),
      provideIncomeStub(gateway),
      provideDebtsStub(new DebtsGatewayStub()),
    ],
  });
  await result.fixture.whenStable();
  result.fixture.detectChanges();
  return { ...result, gateway };
}

function consignadoPreview() {
  return anIncomePreview({
    loanDeductions: [
      {
        kind: 'LOAN',
        label: 'Consignado',
        amount: brl('450.00'),
        debtId: 'debt-1',
        interestAmount: brl('50.00'),
        principalAmount: brl('400.00'),
        confidence: 'ESTIMATED',
        warnings: ['PAYROLL_INTEREST_NOT_SPLIT'],
      },
    ],
    net: brl('7850.00'),
  });
}

describe('IncomePage', () => {
  it('Dado carregando, então mostra o esqueleto com status acessível', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.list$ = () => NEVER;
    await setup(gateway);

    expect(screen.getByTestId('income-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('income-list')).not.toBeInTheDocument();
  });

  it('Dado um perfil ativo, então mostra bruto, adiantamento e saldo e pede a prévia do mês atual para ele', async () => {
    const { gateway } = await setup();

    expect(gateway.listStatuses[0]).toBe('ACTIVE');
    expect(text(screen.getByTestId('income-profile-gross-inc-1'))).toBe('R$ 10.000,00');
    expect(screen.getByTestId('income-profile-advance-inc-1')).toHaveTextContent('16');
    expect(gateway.previews).toEqual([{ id: 'inc-1', month: todayIso().slice(0, 7) }]);
  });

  it('Dado a prévia, então mostra INSS, IRRF, líquido e as datas dos pagamentos como o servidor calculou', async () => {
    await setup();

    expect(text(screen.getByTestId('income-preview-gross'))).toBe('R$ 10.000,00');
    expect(text(screen.getByTestId('income-preview-inss'))).toBe('R$ 900,00');
    expect(text(screen.getByTestId('income-preview-irrf'))).toBe('R$ 800,00');
    expect(text(screen.getByTestId('income-preview-net'))).toBe('R$ 8.300,00');
    expect(text(screen.getByTestId('income-preview-advance'))).toContain('R$ 3.320,00');
    expect(text(screen.getByTestId('income-preview-balance'))).toContain('R$ 4.980,00');
    expect(screen.queryByTestId('income-preview-thirteenth')).not.toBeInTheDocument();
    expect(screen.getByTestId('income-preview-tables')).toBeInTheDocument();
  });

  it('Dado 13º habilitado, então mostra a 1ª parcela sem descontos', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.preview$ = of(
      anIncomePreview({ thirteenth: { date: '2026-11-30', amount: brl('5000.00') } }),
    );
    await setup(gateway);

    expect(text(screen.getByTestId('income-preview-thirteenth'))).toContain('R$ 5.000,00');
  });

  it('Dado consignado em folha, então mostra principal, juros, a marca de estimado e o aviso de juros não informados', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.preview$ = of(consignadoPreview());
    await setup(gateway);

    const loans = screen.getByTestId('income-preview-loans');
    expect(text(loans)).toContain('Consignado');
    expect(text(loans)).toContain('R$ 450,00');
    expect(text(loans)).toContain('Principal baixado: R$ 400,00');
    expect(text(loans)).toContain('Juros da parcela: R$ 50,00');
    expect(within(loans).getByTestId('income-preview-estimated')).toBeInTheDocument();
    expect(within(loans).getByTestId('income-preview-interest-not-split')).toBeInTheDocument();
    expect(text(screen.getByTestId('income-preview-net'))).toBe('R$ 7.850,00');
  });

  it('Dado consignado com juros informados, então não mostra o aviso de juros não separados nem a marca de estimado', async () => {
    const gateway = new IncomeGatewayStub();
    const base = consignadoPreview();
    gateway.preview$ = of({
      ...base,
      loanDeductions: [{ ...base.loanDeductions[0]!, confidence: 'CONFIRMED', warnings: [] }],
    });
    await setup(gateway);

    expect(screen.queryByTestId('income-preview-estimated')).not.toBeInTheDocument();
    expect(screen.queryByTestId('income-preview-interest-not-split')).not.toBeInTheDocument();
  });

  it('Dado TAX_TABLE_UNAVAILABLE na prévia, então avisa em vez de mostrar números e não oferece tentar de novo', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.preview$ = failWith(422, 'TAX_TABLE_UNAVAILABLE');
    await setup(gateway);

    expect(screen.getByTestId('income-preview-tax-unavailable')).toHaveTextContent(
      'Tabela fiscal indisponível',
    );
    expect(screen.queryByTestId('income-preview-values')).not.toBeInTheDocument();
    expect(screen.queryByTestId('income-preview-retry')).not.toBeInTheDocument();
  });

  it('Dado erro 500 na prévia, quando tento de novo, então recarrega a prévia', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.preview$ = failWith(500, 'INTERNAL');
    const { fixture } = await setup(gateway);

    expect(screen.getByTestId('income-preview-error')).toBeInTheDocument();
    gateway.preview$ = of(anIncomePreview());
    await userEvent.click(screen.getByTestId('income-preview-retry'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByTestId('income-preview-values')).toBeInTheDocument();
  });

  it('Dado a lista vazia, então mostra o estado vazio com a ação de criar', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.profiles = [];
    await setup(gateway);

    expect(screen.getByText(/Nenhum perfil de renda/i)).toBeInTheDocument();
    expect(gateway.previews).toEqual([]);
  });

  it('Dado falha ao listar, quando tento de novo, então mostra os perfis', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.list$ = () => failWith(500, 'INTERNAL');
    const { fixture } = await setup(gateway);

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    gateway.list$ = null;
    await userEvent.click(screen.getByTestId('empty-state-action-retry'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByTestId('income-list')).toBeInTheDocument();
  });

  it('Dado dois perfis, quando escolho o segundo, então a prévia é pedida para ele', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.profiles = [anIncomeProfile(), anIncomeProfile({ id: 'inc-2', source: 'Empresa B' })];
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('income-profile-preview-inc-2'));
    await fixture.whenStable();

    expect(gateway.previews.at(-1)?.id).toBe('inc-2');
  });

  it('Dado arquivar, quando confirmo, então arquiva, avisa e recarrega a lista', async () => {
    const { gateway, fixture } = await setup();

    await userEvent.click(screen.getByTestId('income-profile-archive-inc-1'));
    await userEvent.click(await screen.findByRole('button', { name: 'Arquivar' }));
    await fixture.whenStable();

    expect(gateway.archives).toEqual(['inc-1']);
    expect(gateway.listStatuses.length).toBeGreaterThanOrEqual(2);
  });

  it('Dado erro ao arquivar, então mostra o erro e não recarrega', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.archive$ = failWith(404, 'INCOME_PROFILE_NOT_FOUND');
    await setup(gateway);

    await userEvent.click(screen.getByTestId('income-profile-archive-inc-1'));
    await userEvent.click(await screen.findByRole('button', { name: 'Arquivar' }));

    expect(await screen.findByTestId('income-action-error')).toBeInTheDocument();
    expect(gateway.listStatuses).toHaveLength(1);
  });

  it('Dado o filtro Arquivados, então consulta ARCHIVED e não oferece editar nem arquivar', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.profiles = [anIncomeProfile({ id: 'inc-old', status: 'ARCHIVED' })];
    const { fixture } = await setup(gateway);

    await userEvent.click(within(screen.getByTestId('income-status')).getByText('Arquivados'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.listStatuses.at(-1)).toBe('ARCHIVED');
    expect(screen.getByTestId('income-profile-archived-inc-old')).toBeInTheDocument();
    expect(screen.queryByTestId('income-profile-edit-inc-old')).not.toBeInTheDocument();
    expect(screen.queryByTestId('income-profile-archive-inc-old')).not.toBeInTheDocument();
  });

  it('Dado gerar ocorrências para a janela padrão, então envia o período e mostra novas e existentes', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.generate$ = of([
      {
        kind: 'ADVANCE',
        competence: '2026-11',
        date: '2026-11-16',
        amount: brl('3320.00'),
        recurrenceId: 'rec-1',
        created: true,
      },
      {
        kind: 'BALANCE',
        competence: '2026-11',
        date: '2026-12-01',
        amount: brl('4980.00'),
        recurrenceId: 'rec-2',
        created: false,
      },
    ]);
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('income-generate-action'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(gateway.generates).toHaveLength(1);
    expect(gateway.generates[0]!.id).toBe('inc-1');
    expect(screen.getByTestId('income-generate-summary')).toHaveTextContent(
      '1 novas e 1 que já existiam.',
    );
    expect(screen.getByTestId('income-generate-item-rec-1')).toHaveTextContent('Nova');
    expect(screen.getByTestId('income-generate-item-rec-2')).toHaveTextContent('Já existia');
  });

  it('Dado a geração em andamento, então desabilita o botão e não envia duas vezes', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.generate$ = NEVER;
    await setup(gateway);

    await userEvent.click(screen.getByTestId('income-generate-action'));
    await userEvent.click(screen.getByTestId('income-generate-action'));

    expect(gateway.generates).toHaveLength(1);
    expect(screen.getByTestId('income-generate-action')).toBeDisabled();
  });

  it('Dado erro ao gerar, então mostra o erro e nenhum resultado', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.generate$ = failWith(422, 'TAX_TABLE_UNAVAILABLE');
    await setup(gateway);

    await userEvent.click(screen.getByTestId('income-generate-action'));

    expect(await screen.findByTestId('income-generate-error')).toBeInTheDocument();
    expect(screen.queryByTestId('income-generate-result')).not.toBeInTheDocument();
  });

  it('Dado as tabelas fiscais, então lista a versão, a vigência e a fonte citada', async () => {
    const { gateway } = await setup();

    expect(gateway.taxYears[0]).toBe(Number(todayIso().slice(0, 4)));
    const table = screen.getByTestId('tax-table-INSS-1');
    expect(text(table)).toContain('Norma 1/2026');
    expect(text(table)).toContain('R$ 8.000,00');
  });

  it('Dado nenhuma tabela vigente para o ano, então avisa que não há tabela em vez de inventar números', async () => {
    const gateway = new IncomeGatewayStub();
    gateway.taxTables$ = of([]);
    await setup(gateway);

    expect(screen.getByTestId('tax-tables-unavailable')).toHaveTextContent(
      'Tabela fiscal indisponível',
    );
    expect(screen.queryByTestId('tax-tables-list')).not.toBeInTheDocument();
  });

  it('Dado criar perfil sem preencher, então mostra os erros e não chama o backend', async () => {
    const { gateway } = await setup();

    await userEvent.click(screen.getByTestId('income-add'));
    await screen.findByTestId('income-form');
    await userEvent.click(screen.getByTestId('income-form-save'));

    expect(gateway.creates).toEqual([]);
    expect(screen.getByTestId('income-form')).toBeInTheDocument();
  });

  it('Dado criar perfil com origem e bruto, então envia com a chave de idempotência e recarrega', async () => {
    const { gateway, fixture } = await setup();

    await userEvent.click(screen.getByTestId('income-add'));
    await screen.findByTestId('income-form');
    await userEvent.type(screen.getByTestId('income-form-source'), 'Empresa C');
    await userEvent.type(screen.getByTestId('income-form-gross'), '12.000,00');
    await userEvent.click(screen.getByTestId('income-form-save'));
    await fixture.whenStable();

    await waitFor(() => expect(gateway.creates).toHaveLength(1));
    expect(gateway.creates[0]!.input).toMatchObject({
      source: 'Empresa C',
      gross: '12000.00',
      advance: null,
      deductions: [],
    });
    expect(gateway.creates[0]!.key).toBeTruthy();
    expect(gateway.listStatuses.length).toBeGreaterThanOrEqual(2);
  });

  it('Dado editar um perfil, então carrega os valores e envia a version atual', async () => {
    const { gateway, fixture } = await setup();

    await userEvent.click(screen.getByTestId('income-profile-edit-inc-1'));
    await screen.findByTestId('income-form');
    expect(screen.getByTestId('income-form-source')).toHaveValue('Empresa A');
    await userEvent.clear(screen.getByTestId('income-form-source'));
    await userEvent.type(screen.getByTestId('income-form-source'), 'Empresa A2');
    await userEvent.click(screen.getByTestId('income-form-save'));
    await fixture.whenStable();

    await waitFor(() => expect(gateway.updates).toHaveLength(1));
    expect(gateway.updates[0]).toMatchObject({
      id: 'inc-1',
      input: { source: 'Empresa A2', gross: '10000.00', version: 2 },
    });
  });

  it('Dado a tela pronta, então não tem violações de acessibilidade', async () => {
    const { container } = await setup();

    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});

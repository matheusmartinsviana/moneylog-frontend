import { provideRouter } from '@angular/router';
import { render, screen, waitFor, within } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER, of } from 'rxjs';

import { NetWorthPage } from '~/app/features/planning/pages/net-worth.page';
import { failWith } from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';
import {
  aNetWorth,
  anAsset,
  AssetsGatewayStub,
  NetWorthGatewayStub,
  provideNetWorthStubs,
} from '~/testing/net-worth-testing';

vi.setConfig({ testTimeout: 30_000 });

const brl = (amount: string) => ({ amount, currency: 'BRL' });

const text = (el: HTMLElement) =>
  el.textContent
    ?.replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();

async function setup(assets = new AssetsGatewayStub(), netWorth = new NetWorthGatewayStub()) {
  const result = await render(NetWorthPage, {
    providers: [
      provideI18nTesting('pt'),
      provideRouter([]),
      provideNetWorthStubs(assets, netWorth),
    ],
  });
  await result.fixture.whenStable();
  result.fixture.detectChanges();
  return { ...result, assets, netWorth };
}

describe('NetWorthPage', () => {
  it('Dado carregando, então mostra os dois esqueletos e nenhum valor', async () => {
    const assets = new AssetsGatewayStub();
    assets.list$ = () => NEVER;
    const netWorth = new NetWorthGatewayStub();
    netWorth.overview$ = NEVER;
    await setup(assets, netWorth);

    expect(screen.getByTestId('net-worth-loading')).toBeInTheDocument();
    expect(screen.getByTestId('assets-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('net-worth-overview')).not.toBeInTheDocument();
  });

  it('Dado o patrimônio, então separa disponível de não disponível e mostra o que o servidor devolveu', async () => {
    await setup();

    expect(text(screen.getByTestId('net-worth-cash'))).toBe('R$ 5.000,00');
    expect(text(screen.getByTestId('net-worth-available-assets'))).toBe('R$ 2.000,00');
    expect(text(screen.getByTestId('net-worth-reserved-assets'))).toBe('R$ 30.000,00');
    expect(text(screen.getByTestId('net-worth-receivables'))).toBe('R$ 700,00');
    expect(text(screen.getByTestId('net-worth-debts'))).toBe('R$ 1.500,00');
    expect(screen.getByTestId('net-worth-overview')).toHaveTextContent('Não disponível');
    expect(screen.getByTestId('net-worth-no-double-count')).toBeInTheDocument();
  });

  it('Dado a reserva de emergência, então mostra reserva, base mensal e cobertura sem recalcular', async () => {
    await setup();

    expect(text(screen.getByTestId('net-worth-reserve-amount'))).toBe('R$ 2.000,00');
    expect(text(screen.getByTestId('net-worth-reserve-base'))).toBe('R$ 1.000,00');
    expect(screen.getByTestId('net-worth-reserve-coverage')).toHaveTextContent('2,0 meses');
    expect(screen.queryByTestId('net-worth-target')).not.toBeInTheDocument();
  });

  it('Dado base mensal zero, então diz que a cobertura não pode ser calculada em vez de mostrar infinito', async () => {
    const netWorth = new NetWorthGatewayStub();
    netWorth.overview$ = of(
      aNetWorth({
        emergencyReserve: {
          amount: brl('2000.00'),
          monthlyBase: brl('0.00'),
          coverageMonths: null,
          targetMonths: null,
          targetAmount: null,
          missingToTarget: null,
        },
      }),
    );
    await setup(undefined, netWorth);

    expect(screen.getByTestId('net-worth-reserve-no-base')).toBeInTheDocument();
  });

  it('Dado calcular a meta de 6 meses, então pede ao backend com a meta e mostra o valor e o que falta', async () => {
    const netWorth = new NetWorthGatewayStub();
    const { fixture } = await setup(undefined, netWorth);
    netWorth.overview$ = of(
      aNetWorth({
        emergencyReserve: {
          amount: brl('2000.00'),
          monthlyBase: brl('1000.00'),
          coverageMonths: '2.0',
          targetMonths: 6,
          targetAmount: brl('6000.00'),
          missingToTarget: brl('4000.00'),
        },
      }),
    );

    await userEvent.click(screen.getByTestId('net-worth-target-apply'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(netWorth.targets.at(-1)).toBe(6);
    expect(text(screen.getByTestId('net-worth-target-amount'))).toBe('R$ 6.000,00');
    expect(text(screen.getByTestId('net-worth-target-missing'))).toBe('R$ 4.000,00');
    expect(screen.getByTestId('net-worth-target-clear')).toBeInTheDocument();
  });

  it('Dado limpar a meta, então volta a consultar sem meta', async () => {
    const netWorth = new NetWorthGatewayStub();
    const { fixture } = await setup(undefined, netWorth);

    await userEvent.click(screen.getByTestId('net-worth-target-apply'));
    await fixture.whenStable();
    await userEvent.click(screen.getByTestId('net-worth-target-clear'));
    await fixture.whenStable();

    expect(netWorth.targets.at(-1)).toBeNull();
    expect(screen.queryByTestId('net-worth-target-clear')).not.toBeInTheDocument();
  });

  it('Dado falha no patrimônio, quando tento de novo, então recarrega', async () => {
    const netWorth = new NetWorthGatewayStub();
    netWorth.overview$ = failWith(500, 'INTERNAL');
    const { fixture } = await setup(undefined, netWorth);

    expect(screen.getAllByTestId('error-state')).toHaveLength(1);
    netWorth.overview$ = null;
    await userEvent.click(screen.getByTestId('empty-state-action-retry'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByTestId('net-worth-overview')).toBeInTheDocument();
  });

  it('Dado o FGTS, então aparece como não disponível, sem "conta na reserva" e com o saldo do servidor', async () => {
    await setup();

    expect(screen.getByTestId('asset-kind-asset-1')).toHaveTextContent('FGTS');
    expect(screen.getByTestId('asset-availability-asset-1')).toHaveTextContent('Não disponível');
    expect(screen.queryByTestId('asset-reserve-asset-1')).not.toBeInTheDocument();
    expect(text(screen.getByTestId('asset-balance-asset-1'))).toBe('R$ 30.000,00');
    expect(screen.getByTestId('asset-deposit-asset-1')).toHaveTextContent('R$ 800,00');
  });

  it('Dado ativo disponível marcado como reserva, então mostra a marca', async () => {
    const assets = new AssetsGatewayStub();
    assets.assets = [
      anAsset({
        id: 'asset-2',
        kind: 'OTHER',
        availability: 'AVAILABLE',
        countsAsReserve: true,
        name: 'Renda fixa',
      }),
    ];
    await setup(assets);

    expect(screen.getByTestId('asset-reserve-asset-2')).toHaveTextContent('Conta na reserva');
  });

  it('Dado nenhum ativo, então mostra o estado vazio com a ação de criar', async () => {
    const assets = new AssetsGatewayStub();
    assets.assets = [];
    await setup(assets);

    expect(screen.getByText('Nenhum ativo cadastrado')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('empty-state-action-add'));
    expect(await screen.findByTestId('asset-form')).toBeInTheDocument();
  });

  it('Dado falha ao listar ativos, quando tento de novo, então mostra a lista', async () => {
    const assets = new AssetsGatewayStub();
    assets.list$ = () => failWith(500, 'INTERNAL');
    const { fixture } = await setup(assets);

    assets.list$ = null;
    await userEvent.click(screen.getByTestId('empty-state-action-retry'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByTestId('assets-list')).toBeInTheDocument();
  });

  it('Dado o histórico, quando abro, então lista os saldos registrados', async () => {
    await setup();

    await userEvent.click(screen.getByTestId('asset-history-toggle-asset-1'));

    expect(await screen.findByTestId('asset-history-list')).toBeInTheDocument();
    expect(within(screen.getByTestId('asset-history-list')).getAllByRole('listitem')).toHaveLength(
      2,
    );
  });

  it('Dado atualizar o saldo, então envia o novo saldo e a data e recarrega o patrimônio', async () => {
    const { assets, netWorth, fixture } = await setup();

    await userEvent.click(screen.getByTestId('asset-update-balance-asset-1'));
    await screen.findByTestId('asset-balance-form');
    await userEvent.clear(screen.getByTestId('asset-balance-value'));
    await userEvent.type(screen.getByTestId('asset-balance-value'), '31.000,00');
    await userEvent.click(screen.getByTestId('asset-balance-save'));
    await fixture.whenStable();

    await waitFor(() => expect(assets.balances).toHaveLength(1));
    expect(assets.balances[0]).toMatchObject({ id: 'asset-1', input: { balance: '31000.00' } });
    expect(netWorth.targets.length).toBeGreaterThanOrEqual(2);
  });

  it('Dado arquivar, quando confirmo, então arquiva e recarrega ativos e patrimônio', async () => {
    const { assets, netWorth, fixture } = await setup();

    await userEvent.click(screen.getByTestId('asset-archive-asset-1'));
    await userEvent.click(await screen.findByRole('button', { name: 'Arquivar' }));
    await fixture.whenStable();

    expect(assets.archives).toEqual(['asset-1']);
    expect(netWorth.targets.length).toBeGreaterThanOrEqual(2);
  });

  it('Dado erro ao arquivar, então mostra o erro', async () => {
    const assets = new AssetsGatewayStub();
    assets.archive$ = failWith(404, 'ASSET_NOT_FOUND');
    await setup(assets);

    await userEvent.click(screen.getByTestId('asset-archive-asset-1'));
    await userEvent.click(await screen.findByRole('button', { name: 'Arquivar' }));

    expect(await screen.findByTestId('assets-action-error')).toBeInTheDocument();
  });

  it('Dado o filtro Arquivados, então consulta ARCHIVED e não oferece ações de edição', async () => {
    const assets = new AssetsGatewayStub();
    assets.assets = [anAsset({ id: 'asset-old', status: 'ARCHIVED' })];
    const { fixture } = await setup(assets);

    await userEvent.click(within(screen.getByTestId('assets-status')).getByText('Arquivados'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(assets.listStatuses.at(-1)).toBe('ARCHIVED');
    expect(screen.queryByTestId('asset-edit-asset-old')).not.toBeInTheDocument();
    expect(screen.queryByTestId('asset-update-balance-asset-old')).not.toBeInTheDocument();
  });

  it('Dado criar ativo FGTS, então envia disponibilidade RESERVED e nunca conta como reserva', async () => {
    const { assets, fixture } = await setup();

    await userEvent.click(screen.getByTestId('assets-add'));
    await screen.findByTestId('asset-form');
    await userEvent.type(screen.getByTestId('asset-form-name'), 'FGTS Empresa B');
    await userEvent.click(screen.getByRole('radio', { name: 'FGTS' }));
    await userEvent.type(screen.getByTestId('asset-form-balance'), '10.000,00');
    await userEvent.click(screen.getByTestId('asset-form-save'));
    await fixture.whenStable();

    await waitFor(() => expect(assets.creates).toHaveLength(1));
    expect(assets.creates[0]!.input).toMatchObject({
      kind: 'FGTS',
      availability: 'RESERVED',
      countsAsReserve: false,
      balance: '10000.00',
    });
  });

  it('Dado ativo disponível marcado como reserva, então o pedido leva countsAsReserve verdadeiro', async () => {
    const { assets, fixture } = await setup();

    await userEvent.click(screen.getByTestId('assets-add'));
    await screen.findByTestId('asset-form');
    await userEvent.type(screen.getByTestId('asset-form-name'), 'Renda fixa');
    await userEvent.type(screen.getByTestId('asset-form-balance'), '1.000,00');
    await userEvent.click(screen.getByTestId('asset-form-counts-as-reserve'));
    await userEvent.click(screen.getByTestId('asset-form-save'));
    await fixture.whenStable();

    await waitFor(() => expect(assets.creates).toHaveLength(1));
    expect(assets.creates[0]!.input).toMatchObject({
      kind: 'OTHER',
      availability: 'AVAILABLE',
      countsAsReserve: true,
    });
  });

  it('Dado marcar "conta na reserva" num ativo disponível e depois trocar para FGTS, então o pedido não leva countsAsReserve verdadeiro', async () => {
    const { assets, fixture } = await setup();

    await userEvent.click(screen.getByTestId('assets-add'));
    await screen.findByTestId('asset-form');
    await userEvent.type(screen.getByTestId('asset-form-name'), 'Ativo X');
    await userEvent.type(screen.getByTestId('asset-form-balance'), '1.000,00');
    await userEvent.click(screen.getByTestId('asset-form-counts-as-reserve'));
    await userEvent.click(screen.getByRole('radio', { name: 'FGTS' }));
    await userEvent.click(screen.getByTestId('asset-form-save'));
    await fixture.whenStable();

    await waitFor(() => expect(assets.creates).toHaveLength(1));
    expect(assets.creates[0]!.input.kind).toBe('FGTS');
    expect(assets.creates[0]!.input.countsAsReserve).toBe(false);
  });

  it('Dado criar sem nome e sem saldo, então mostra os erros e não chama o backend', async () => {
    const { assets } = await setup();

    await userEvent.click(screen.getByTestId('assets-add'));
    await screen.findByTestId('asset-form');
    await userEvent.click(screen.getByTestId('asset-form-save'));

    expect(assets.creates).toEqual([]);
    expect(screen.getByTestId('asset-form')).toBeInTheDocument();
  });

  it('Dado editar um ativo, então não pede saldo e envia a version', async () => {
    const { assets, fixture } = await setup();

    await userEvent.click(screen.getByTestId('asset-edit-asset-1'));
    await screen.findByTestId('asset-form');
    expect(screen.queryByTestId('asset-form-balance')).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId('asset-form-save'));
    await fixture.whenStable();

    await waitFor(() => expect(assets.updates).toHaveLength(1));
    expect(assets.updates[0]).toMatchObject({
      id: 'asset-1',
      input: { kind: 'FGTS', availability: 'RESERVED', version: 1 },
    });
  });

  it('Dado a tela pronta, então não tem violações de acessibilidade', async () => {
    const { container } = await setup();

    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});

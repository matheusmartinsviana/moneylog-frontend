import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { ThirdPartyInstallmentsComponent } from '~/app/features/planning/components/third-party-installments/third-party-installments.component';
import { brl, failWith } from '~/testing/accounts-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';
import {
  anInstallment,
  provideThirdPartiesStub,
  ThirdPartiesGatewayStub,
} from '~/testing/third-parties-testing';

vi.setConfig({ testTimeout: 30_000 });

const text = (el: HTMLElement) => el.textContent?.replace(/\s+/g, ' ').trim();

async function setup(installments = [anInstallment()], gateway = new ThirdPartiesGatewayStub()) {
  const changes: unknown[] = [];
  const result = await render(ThirdPartyInstallmentsComponent, {
    inputs: { transactionId: 'tx-1', personId: 'person-1', installments },
    on: { changed: () => changes.push(true) },
    providers: [provideI18nTesting('pt'), provideThirdPartiesStub(gateway)],
  });
  return { ...result, gateway, changes };
}

describe('ThirdPartyInstallmentsComponent', () => {
  it('Dado parcela com saldo, então mostra o mês previsto e "Mudar mês", sem "Voltar ao vencimento"', async () => {
    await setup();

    expect(text(screen.getByTestId('tp-installment-expected-inst-1'))).toBe(
      'Previsto para novembro de 2026',
    );
    expect(screen.getByTestId('tp-installment-change-inst-1')).toBeInTheDocument();
    expect(screen.queryByTestId('tp-installment-reset-inst-1')).toBeNull();
  });

  it('Dado parcela com mês escolhido, então oferece voltar ao vencimento e envia null', async () => {
    const { gateway, changes } = await setup([
      anInstallment({ overridden: true, expectedMonth: '2027-01' }),
    ]);

    await userEvent.click(screen.getByTestId('tp-installment-reset-inst-1'));

    expect(gateway.expectedMonthCalls).toEqual([
      { transactionId: 'tx-1', installmentId: 'inst-1', personId: 'person-1', expectedMonth: null },
    ]);
    expect(changes).toHaveLength(1);
  });

  it('Dado parcela já recebida, então não oferece edição', async () => {
    await setup([anInstallment({ pending: brl('0.00'), received: brl('100.00') })]);

    expect(screen.queryByTestId('tp-installment-change-inst-1')).toBeNull();
    expect(screen.queryByTestId('tp-installment-reset-inst-1')).toBeNull();
  });

  it('Dado "Mudar mês", quando cancela, então fecha o seletor sem chamar o servidor', async () => {
    const { gateway } = await setup();

    await userEvent.click(screen.getByTestId('tp-installment-change-inst-1'));
    expect(screen.getByTestId('tp-installment-month-inst-1')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('tp-installment-cancel-inst-1'));

    expect(screen.queryByTestId('tp-installment-month-inst-1')).toBeNull();
    expect(gateway.expectedMonthCalls).toEqual([]);
  });

  it('Dado o seletor aberto, quando salva, então envia o mês do seletor e avisa a tela para recarregar', async () => {
    const { gateway, changes } = await setup();

    await userEvent.click(screen.getByTestId('tp-installment-change-inst-1'));
    await userEvent.click(screen.getByTestId('tp-installment-save-inst-1'));

    expect(gateway.expectedMonthCalls[0]).toMatchObject({
      installmentId: 'inst-1',
      expectedMonth: '2026-11',
    });
    expect(changes).toHaveLength(1);
    expect(screen.queryByTestId('tp-installment-month-inst-1')).toBeNull();
  });

  it('Dado 422 de mês inválido, então mostra a mensagem do código e mantém o seletor aberto', async () => {
    const gateway = new ThirdPartiesGatewayStub();
    gateway.expectedMonth$ = failWith(422, 'RECEIVABLE_EXPECTED_MONTH_INVALID');
    const { changes } = await setup([anInstallment()], gateway);

    await userEvent.click(screen.getByTestId('tp-installment-change-inst-1'));
    await userEvent.click(screen.getByTestId('tp-installment-save-inst-1'));

    expect(await screen.findByTestId('tp-installment-error')).toHaveTextContent(
      'Escolha um mês entre 01/2000 e 12/2100.',
    );
    expect(screen.getByTestId('tp-installment-month-inst-1')).toBeInTheDocument();
    expect(changes).toEqual([]);
  });
});

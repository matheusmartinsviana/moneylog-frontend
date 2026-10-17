import { provideRouter } from '@angular/router';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { NEVER, of } from 'rxjs';

import { FileDownloadService } from '~/app/common/services/file-download.service';
import { PropertyPage } from '~/app/features/planning/pages/property.page';
import { brl, failWith } from '~/testing/accounts-testing';
import { axeViolations, describeViolations } from '~/testing/axe';
import {
  aLoan,
  aProject,
  CommitmentsGatewayStub,
  provideCommitmentsStub,
} from '~/testing/commitments-testing';
import { provideI18nTesting } from '~/testing/i18n-testing';
import { aPerson, PeopleGatewayStub, providePeopleStub } from '~/testing/people-testing';

vi.setConfig({ testTimeout: 30_000 });

const text = (el: HTMLElement) =>
  el.textContent
    ?.replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim();

function definedProject() {
  const base = aProject();
  return aProject({
    schedule: base.schedule.map((item) =>
      item.position === 3
        ? item
        : {
            ...item,
            sharesDefined: true,
            shares: [
              { personId: null, amount: brl('6000.00') },
              { personId: 'person-1', amount: brl('4000.00') },
            ],
          },
    ),
    totalsByPerson: [
      { personId: null, paid: brl('6000.00'), pending: brl('46000.00'), total: brl('52000.00') },
      {
        personId: 'person-1',
        paid: brl('4000.00'),
        pending: brl('4000.00'),
        total: brl('8000.00'),
      },
    ],
    clauses: {
      lateFeeBps: 200,
      monthlyInterestBps: 100,
      terminationRetentionBps: 1000,
      terminationRetentionAmount: brl('10000.00'),
      notes: 'Multa só após 10 dias',
    },
  });
}

async function setup(gateway = new CommitmentsGatewayStub(), id = 'c-project') {
  const people = new PeopleGatewayStub();
  people.people = [aPerson({ id: 'person-1', name: 'Ana' })];
  const download = {
    prepare: vi.fn((file) => ({ file, url: 'blob:x', release: vi.fn() })),
    save: vi.fn(),
  };
  const result = await render(PropertyPage, {
    inputs: { id },
    providers: [
      provideI18nTesting('pt'),
      provideRouter([]),
      provideCommitmentsStub(gateway),
      providePeopleStub(people),
      { provide: FileDownloadService, useValue: download },
    ],
  });
  await result.fixture.whenStable();
  result.fixture.detectChanges();
  return { ...result, gateway, download };
}

describe('PropertyPage', () => {
  it('Dado carregando, então mostra o esqueleto com status acessível', async () => {
    const gateway = new CommitmentsGatewayStub();
    gateway.get$ = NEVER;
    await setup(gateway);

    expect(screen.getByTestId('property-loading')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Carregando o imóvel');
  });

  it('Dado 404, então diz que o imóvel não foi encontrado com o caminho de volta', async () => {
    const gateway = new CommitmentsGatewayStub();
    gateway.get$ = failWith(404, 'COMMITMENT_NOT_FOUND');
    await setup(gateway);

    expect(screen.getByText('Imóvel não encontrado')).toBeInTheDocument();
  });

  it('Dado um compromisso que não é projeto de longo prazo, então explica em vez de mostrar o cronograma', async () => {
    const gateway = new CommitmentsGatewayStub();
    gateway.get$ = of(aLoan());
    await setup(gateway, 'c-loan');

    expect(screen.getByText('Este compromisso não é um projeto')).toBeInTheDocument();
    expect(screen.queryByTestId('property-summary')).not.toBeInTheDocument();
  });

  it('Dado erro 500 na carga, quando tento de novo, então relê o imóvel', async () => {
    const gateway = new CommitmentsGatewayStub();
    gateway.get$ = failWith(500, 'INTERNAL');
    const { fixture } = await setup(gateway);

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    gateway.get$ = of(aProject());
    await userEvent.click(screen.getByTestId('empty-state-action-retry'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(screen.getByTestId('property-summary')).toBeInTheDocument();
  });

  it('Dado cota não definida, então avisa quantos itens estão sem cota e marca cada um como estimado', async () => {
    await setup();

    expect(screen.getByTestId('property-undefined-banner')).toHaveTextContent(
      '3 item(ns) sem cota definida',
    );
    expect(screen.getByTestId('property-undefined-1')).toHaveTextContent('Cota não definida');
    expect(screen.getByTestId('property-undefined-2')).toHaveTextContent('Estimado');
    expect(screen.queryByTestId('property-share-1-me')).not.toBeInTheDocument();
  });

  it('Dado cotas definidas, então mostra a minha cota e a do co-comprador exatamente como o servidor devolveu', async () => {
    const gateway = new CommitmentsGatewayStub();
    gateway.get$ = of(definedProject());
    await setup(gateway);

    expect(text(screen.getByTestId('property-share-1-me'))).toContain('R$ 6.000,00');
    expect(text(screen.getByTestId('property-share-1-person-1'))).toContain('Cota de Ana');
    expect(text(screen.getByTestId('property-share-1-person-1'))).toContain('R$ 4.000,00');
    expect(screen.getByTestId('property-undefined-3')).toBeInTheDocument();
  });

  it('Dado os totais por pessoa, então mostra pago, pendente e total de cada um', async () => {
    const gateway = new CommitmentsGatewayStub();
    gateway.get$ = of(definedProject());
    await setup(gateway);

    expect(text(screen.getByTestId('property-person-me'))).toContain('Eu');
    expect(text(screen.getByTestId('property-person-me'))).toContain('R$ 52.000,00');
    expect(text(screen.getByTestId('property-person-person-1'))).toContain('Ana');
    expect(text(screen.getByTestId('property-person-person-1'))).toContain('R$ 8.000,00');
  });

  it('Dado definir cotas, quando informo a minha cota e a do co-comprador, então envia as duas com a version', async () => {
    const gateway = new CommitmentsGatewayStub();
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('property-edit-shares-2'));
    expect(await screen.findByTestId('property-shares-form')).toBeInTheDocument();
    await userEvent.clear(screen.getByTestId('property-share-mine'));
    await userEvent.type(screen.getByTestId('property-share-mine'), '6.000,00');
    await userEvent.click(screen.getByTestId('property-share-co-buyer'));
    await userEvent.click(await screen.findByRole('option', { name: 'Ana' }));
    await userEvent.type(screen.getByTestId('property-share-co-buyer-amount'), '4.000,00');
    await userEvent.click(screen.getByTestId('property-shares-save'));
    await fixture.whenStable();

    expect(gateway.shareUpdates).toHaveLength(1);
    expect(gateway.shareUpdates[0]).toMatchObject({
      id: 'c-project',
      position: 2,
      input: {
        coBuyerPersonId: 'person-1',
        shares: [
          { personId: null, amount: '6000.00' },
          { personId: 'person-1', amount: '4000.00' },
        ],
        version: 3,
      },
    });
  });

  it('Dado a soma das cotas que não fecha, então mostra o erro do servidor no sheet e mantém aberto', async () => {
    const gateway = new CommitmentsGatewayStub();
    gateway.shares$ = failWith(422, 'COMMITMENT_SHARES_SUM_MISMATCH');
    await setup(gateway);

    await userEvent.click(screen.getByTestId('property-edit-shares-2'));
    await screen.findByTestId('property-shares-form');
    await userEvent.click(screen.getByTestId('property-shares-save'));

    expect(await screen.findByTestId('property-shares-error')).toBeInTheDocument();
    expect(screen.getByTestId('property-shares-form')).toBeInTheDocument();
  });

  it('Dado item com mais de duas pessoas, então não oferece editar pela tela', async () => {
    const gateway = new CommitmentsGatewayStub();
    const base = aProject();
    gateway.get$ = of(
      aProject({
        schedule: base.schedule.map((item) =>
          item.position === 2
            ? {
                ...item,
                sharesDefined: true,
                shares: [
                  { personId: null, amount: brl('4000.00') },
                  { personId: 'person-1', amount: brl('3000.00') },
                  { personId: 'person-2', amount: brl('3000.00') },
                ],
              }
            : item,
        ),
      }),
    );
    await setup(gateway);

    expect(screen.queryByTestId('property-edit-shares-2')).not.toBeInTheDocument();
    expect(screen.getByText('Mais de duas pessoas: edite pela API.')).toBeInTheDocument();
  });

  it('Dado cláusulas registradas, então mostra multa, juros, retenção e o valor calculado pelo servidor', async () => {
    const gateway = new CommitmentsGatewayStub();
    gateway.get$ = of(definedProject());
    await setup(gateway);

    expect(screen.getByTestId('property-clause-late-fee')).toHaveTextContent('2');
    expect(screen.getByTestId('property-clause-interest')).toHaveTextContent('1');
    expect(screen.getByTestId('property-clause-retention')).toHaveTextContent('10');
    expect(text(screen.getByTestId('property-clause-retention-amount'))).toBe('R$ 10.000,00');
    expect(screen.getByTestId('property-clauses')).toHaveTextContent('Multa só após 10 dias');
  });

  it('Dado sem cláusulas, então mostra o vazio e o botão de registrar', async () => {
    await setup();

    expect(screen.getByTestId('property-clauses-empty')).toBeInTheDocument();
    expect(screen.getByTestId('property-edit-clauses')).toHaveTextContent('Registrar cláusulas');
  });

  it('Dado editar cláusulas, quando informo percentuais, então envia em pontos-base com a version', async () => {
    const gateway = new CommitmentsGatewayStub();
    const { fixture } = await setup(gateway);

    await userEvent.click(screen.getByTestId('property-edit-clauses'));
    await screen.findByTestId('property-clauses-form');
    await userEvent.clear(screen.getByTestId('property-clause-late-fee'));
    await userEvent.type(screen.getByTestId('property-clause-late-fee'), '2');
    await userEvent.clear(screen.getByTestId('property-clause-interest'));
    await userEvent.type(screen.getByTestId('property-clause-interest'), '1,5');
    await userEvent.clear(screen.getByTestId('property-clause-retention'));
    await userEvent.type(screen.getByTestId('property-clause-retention'), '10');
    await userEvent.click(screen.getByTestId('property-clauses-save'));
    await fixture.whenStable();

    expect(gateway.clauseUpdates).toEqual([
      {
        id: 'c-project',
        input: {
          lateFeeBps: 200,
          monthlyInterestBps: 150,
          terminationRetentionBps: 1000,
          notes: null,
          version: 3,
        },
      },
    ]);
  });

  it('Dado percentual inválido nas cláusulas, então mostra o erro no campo e não envia', async () => {
    const gateway = new CommitmentsGatewayStub();
    await setup(gateway);

    await userEvent.click(screen.getByTestId('property-edit-clauses'));
    await screen.findByTestId('property-clauses-form');
    await userEvent.clear(screen.getByTestId('property-clause-late-fee'));
    await userEvent.type(screen.getByTestId('property-clause-late-fee'), '101');
    await userEvent.click(screen.getByTestId('property-clauses-save'));

    expect(gateway.clauseUpdates).toEqual([]);
    expect(screen.getByTestId('property-clauses-form')).toBeInTheDocument();
  });

  it('Dado exportar o CSV, então pede por pessoa no idioma da tela e baixa o arquivo', async () => {
    const gateway = new CommitmentsGatewayStub();
    const { download } = await setup(gateway);

    await userEvent.click(screen.getByTestId('property-export'));

    await waitFor(() => expect(gateway.csvRequests).toEqual([{ id: 'c-project', language: 'pt' }]));
    await waitFor(() => expect(download.save).toHaveBeenCalledTimes(1));
    expect(download.prepare.mock.calls[0]![0].filename).toBe('moneylog-imovel-por-pessoa.csv');
  });

  it('Dado falha ao exportar o CSV, então mostra o erro e não baixa nada', async () => {
    const gateway = new CommitmentsGatewayStub();
    gateway.csv$ = failWith(500, 'INTERNAL');
    const { download } = await setup(gateway);

    await userEvent.click(screen.getByTestId('property-export'));

    expect(await screen.findByTestId('property-export-error')).toBeInTheDocument();
    expect(download.save).not.toHaveBeenCalled();
  });

  it('Dado conflito de versão ao salvar cotas, então avisa e relê o imóvel', async () => {
    const gateway = new CommitmentsGatewayStub();
    gateway.shares$ = failWith(409, 'VERSION_CONFLICT');
    await setup(gateway);

    await userEvent.click(screen.getByTestId('property-edit-shares-2'));
    await screen.findByTestId('property-shares-form');
    gateway.get$ = of(aProject({ version: 9 }));
    await userEvent.click(screen.getByTestId('property-shares-save'));

    expect(await screen.findByTestId('property-shares-error')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('property-shares-cancel'));
    await userEvent.click(screen.getByTestId('property-edit-shares-2'));
    await screen.findByTestId('property-shares-form');
    await userEvent.click(screen.getByTestId('property-shares-save'));
    await waitFor(() => expect(gateway.shareUpdates.at(-1)?.input.version).toBe(9));
  });

  it('Dado a tela pronta, então não tem violações de acessibilidade', async () => {
    const gateway = new CommitmentsGatewayStub();
    gateway.get$ = of(definedProject());
    const { container } = await setup(gateway);

    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});

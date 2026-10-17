import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { SubscriptionsFacade } from '~/modules/recurrences/core/facades/subscriptions.facade';
import { failWith } from '~/testing/accounts-testing';
import {
  aSubscription,
  aSubscriptionRecurrence,
  aSubscriptionsPage,
  provideRecurrencesStub,
  RecurrencesGatewayStub,
} from '~/testing/recurrences-testing';

function setup(gateway = new RecurrencesGatewayStub()) {
  TestBed.configureTestingModule({
    providers: [provideRecurrencesStub(gateway), SubscriptionsFacade],
  });
  return { gateway, facade: TestBed.inject(SubscriptionsFacade) };
}

describe('SubscriptionsFacade', () => {
  it('Dado assinaturas, então a lista fica pronta com os totais do servidor', () => {
    const { facade, gateway } = setup();

    facade.load();

    expect(facade.state().status).toBe('ready');
    expect(facade.overview()?.totalMonthly.amount).toBe('25.88');
    expect(gateway.subscriptionQueries[0]).toMatchObject({
      status: 'ACTIVE',
      scope: null,
      page: 1,
    });
  });

  it('Dado nenhuma assinatura, então o estado é vazio', () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.subscriptions = aSubscriptionsPage({ items: [] });
    const { facade } = setup(gateway);

    facade.load();

    expect(facade.state().status).toBe('empty');
  });

  it('Dado falha ao carregar, então o estado é erro e dá para tentar de novo', () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.subscriptions$ = failWith(500, 'INTERNAL');
    const { facade } = setup(gateway);

    facade.load();
    expect(facade.error()?.status).toBe(500);

    gateway.subscriptions$ = null;
    facade.load();
    expect(facade.state().status).toBe('ready');
  });

  it('Dado várias páginas, então junta os itens e mantém os totais da primeira', () => {
    const gateway = new RecurrencesGatewayStub();
    const first = aSubscriptionsPage({ hasNext: true });
    const second = aSubscriptionsPage({
      items: [aSubscription({ recurrence: aSubscriptionRecurrence({ id: 'sub-2' }) })],
    });
    let calls = 0;
    gateway.listSubscriptions = () => of(calls++ === 0 ? first : second);
    const { facade } = setup(gateway);

    facade.load();

    expect(facade.overview()?.items.map((i) => i.recurrence.id)).toEqual(['sub-1', 'sub-2']);
  });

  it('Dado grupo sobreposto, então expõe os ids para o destaque', () => {
    const gateway = new RecurrencesGatewayStub();
    gateway.subscriptions = aSubscriptionsPage({
      overlaps: [
        {
          group: 'streaming',
          monthly: aSubscription().monthlyEquivalent,
          items: [
            { id: 'sub-1', description: 'A', monthlyEquivalent: aSubscription().monthlyEquivalent },
            { id: 'sub-2', description: 'B', monthlyEquivalent: aSubscription().monthlyEquivalent },
          ],
        },
      ],
    });
    const { facade } = setup(gateway);

    facade.load();

    expect([...facade.overlappingIds()]).toEqual(['sub-1', 'sub-2']);
  });

  it('Dado trocar o filtro, então recarrega do servidor com o filtro novo', () => {
    const { facade, gateway } = setup();

    facade.setStatus('ENDED');
    facade.setScope('COMPANY');

    expect(gateway.subscriptionQueries.at(-1)).toMatchObject({ status: 'ENDED', scope: 'COMPANY' });
  });

  it('Dado marcar cancelada, então envia ativo até e recarrega a lista do servidor', () => {
    const { facade, gateway } = setup();
    const canceled: string[] = [];
    facade.canceled$.subscribe((id) => canceled.push(id));
    facade.load();
    const before = gateway.subscriptionQueries.length;

    facade.cancel('sub-1', '2026-11-30');

    expect(gateway.calls).toContain('cancel:sub-1:2026-11-30');
    expect(canceled).toEqual(['sub-1']);
    expect(gateway.subscriptionQueries.length).toBe(before + 1);
    expect(facade.busy()).toBe(false);
  });

  it('Dado erro ao cancelar, então mostra o problema e não recarrega como sucesso', () => {
    const gateway = new RecurrencesGatewayStub();
    const { facade } = setup(gateway);
    facade.load();
    gateway.next = failWith(422, 'RECURRENCE_INVALID');

    facade.cancel('sub-1', '2026-11-30');

    expect(facade.problem()?.code).toBe('RECURRENCE_INVALID');
  });
});

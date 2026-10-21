import { TestBed } from '@angular/core/testing';
import { NEVER, Subject } from 'rxjs';

import {
  QuickEntryTokensFacade,
  type TokenNotice,
} from '~/modules/quick-entry/core/facades/quick-entry-tokens.facade';
import type { QuickEntryTokenCreation } from '~/modules/quick-entry/core/types/quick-entry-token';
import { failWith } from '~/testing/accounts-testing';
import {
  aQuickToken,
  provideQuickEntryStub,
  QuickEntryGatewayStub,
  TEST_SECRET,
} from '~/testing/quick-entry-testing';

const INPUT = { label: 'iPhone', accountId: 'acc-1', expiresInDays: 30 };

function setup(stub = new QuickEntryGatewayStub()) {
  TestBed.configureTestingModule({
    providers: [provideQuickEntryStub(stub), QuickEntryTokensFacade],
  });
  const facade = TestBed.inject(QuickEntryTokensFacade);
  const notices: TokenNotice[] = [];
  facade.notices$.subscribe((notice) => notices.push(notice));
  return { facade, stub, notices };
}

function ids(facade: QuickEntryTokensFacade): string[] {
  const state = facade.tokens();
  return state.status === 'ready' ? state.data.map((token) => token.id) : [];
}

describe('QuickEntryTokensFacade', () => {
  describe('carregar', () => {
    it('Dado o carregamento, então começa em loading e entrega os tokens do mais novo ao mais antigo', () => {
      const stub = new QuickEntryGatewayStub();
      stub.tokens = [
        aQuickToken({ id: 'velho', createdAt: '2026-10-01T00:00:00Z' }),
        aQuickToken({ id: 'novo', createdAt: '2026-10-05T00:00:00Z' }),
      ];
      const { facade } = setup(stub);
      expect(facade.tokens().status).toBe('loading');

      facade.load();

      expect(ids(facade)).toEqual(['novo', 'velho']);
    });

    it('Dado erro na lista, então vira estado de erro e tentar de novo recarrega', () => {
      const stub = new QuickEntryGatewayStub();
      stub.listResult = failWith(500, 'INTERNAL_ERROR');
      const { facade } = setup(stub);

      facade.load();
      expect(facade.tokens().status).toBe('error');
      stub.listResult = null;
      facade.load();

      expect(facade.tokens().status).toBe('ready');
    });

    it('Dado 403, então marca como sem permissão', () => {
      const stub = new QuickEntryGatewayStub();
      stub.listResult = failWith(403, 'FORBIDDEN');
      const { facade } = setup(stub);

      facade.load();

      expect(facade.forbidden()).toBe(true);
    });
  });

  describe('gerar', () => {
    it('Dado o token criado, então o segredo fica só no sinal do segredo, a lista guarda o recurso sem ele e esquecer o segredo o apaga', () => {
      const { facade, stub, notices } = setup();
      facade.load();

      facade.create(INPUT);

      expect(stub.created).toEqual([INPUT]);
      expect(facade.secret()).toEqual({ label: 'iPhone', value: TEST_SECRET });
      expect(ids(facade)).toEqual(['tok-new']);
      expect(JSON.stringify(facade.tokens())).not.toContain(TEST_SECRET);
      expect(notices).toEqual([expect.objectContaining({ kind: 'created' })]);

      facade.dismissSecret();

      expect(facade.secret()).toBeNull();
      expect(JSON.stringify(facade.tokens())).not.toContain(TEST_SECRET);
    });

    it('Dado clique repetido enquanto envia, então chama o backend uma vez só', () => {
      const stub = new QuickEntryGatewayStub();
      const pending = new Subject<QuickEntryTokenCreation>();
      stub.createResult = pending;
      const { facade } = setup(stub);
      facade.load();

      facade.create(INPUT);
      facade.create(INPUT);

      expect(stub.created).toHaveLength(1);
      expect(facade.creating()).toBe(true);
    });

    it('Dado 409 de limite, então guarda o problema, não mostra segredo e recarrega a lista do backend', () => {
      const stub = new QuickEntryGatewayStub();
      stub.tokens = [aQuickToken({ id: 'a' })];
      stub.createResult = failWith(409, 'QUICK_TOKEN_LIMIT_REACHED');
      const { facade } = setup(stub);
      facade.load();
      stub.tokens = [aQuickToken({ id: 'a' }), aQuickToken({ id: 'b' })];

      facade.create(INPUT);

      const state = facade.createState();
      expect(state.status === 'failed' && state.problem.code).toBe('QUICK_TOKEN_LIMIT_REACHED');
      expect(facade.secret()).toBeNull();
      expect(stub.calls.filter((call) => call === 'list')).toHaveLength(2);
      expect(ids(facade).sort()).toEqual(['a', 'b']);
      facade.clearCreateProblem();
      expect(facade.createState().status).toBe('idle');
    });

    it('Dado 422 de conta não permitida, então só registra o problema', () => {
      const stub = new QuickEntryGatewayStub();
      stub.createResult = failWith(422, 'QUICK_ACCOUNT_NOT_ALLOWED');
      const { facade } = setup(stub);
      facade.load();

      facade.create(INPUT);

      const state = facade.createState();
      expect(state.status === 'failed' && state.problem.code).toBe('QUICK_ACCOUNT_NOT_ALLOWED');
      expect(facade.secret()).toBeNull();
    });
  });

  describe('renomear e revogar', () => {
    it('Dado token ativo, quando revoga, então a linha vira o recurso devolvido e avisa', () => {
      const stub = new QuickEntryGatewayStub();
      stub.tokens = [aQuickToken({ id: 'a' })];
      const { facade, notices } = setup(stub);
      facade.load();

      facade.revoke('a');

      const state = facade.tokens();
      expect(state.status === 'ready' && state.data[0]?.status).toBe('REVOKED');
      expect(notices).toEqual([expect.objectContaining({ kind: 'revoked' })]);
      expect(facade.busyIds().size).toBe(0);
    });

    it('Dado renomear, então usa o recurso devolvido', () => {
      const stub = new QuickEntryGatewayStub();
      stub.tokens = [aQuickToken({ id: 'a' })];
      const { facade, notices } = setup(stub);
      facade.load();

      facade.rename('a', 'iPad');

      const state = facade.tokens();
      expect(state.status === 'ready' && state.data[0]?.label).toBe('iPad');
      expect(notices).toEqual([expect.objectContaining({ kind: 'renamed' })]);
    });

    it('Dado a mesma ação em andamento, então ignora o segundo pedido', () => {
      const stub = new QuickEntryGatewayStub();
      stub.tokens = [aQuickToken({ id: 'a' })];
      stub.next = NEVER;
      const { facade } = setup(stub);
      facade.load();

      facade.revoke('a');
      facade.revoke('a');

      expect(stub.calls.filter((call) => call === 'revoke:a')).toHaveLength(1);
      expect(facade.busyIds().has('a')).toBe(true);
    });

    it('Dado 404 ao revogar, então avisa a falha e recarrega a lista', () => {
      const stub = new QuickEntryGatewayStub();
      stub.tokens = [aQuickToken({ id: 'a' })];
      const { facade, notices } = setup(stub);
      facade.load();
      stub.next = failWith(404, 'QUICK_TOKEN_NOT_FOUND');
      stub.tokens = [];

      facade.revoke('a');

      expect(notices).toEqual([expect.objectContaining({ kind: 'failed', action: 'revoke' })]);
      expect(ids(facade)).toEqual([]);
      expect(facade.busyIds().size).toBe(0);
    });
  });
});

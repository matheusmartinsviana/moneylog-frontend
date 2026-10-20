import { TestBed } from '@angular/core/testing';
import { NEVER, Subject } from 'rxjs';

import {
  AccessAdminFacade,
  type AccessNotice,
} from '~/modules/users/core/facades/access-admin.facade';
import {
  aManagedUser,
  anInvitation,
  failWithInvitation,
  InvitationsGatewayStub,
  OWNER_MANAGED,
  provideAccessStubs,
  UsersGatewayStub,
} from '~/testing/access-testing';
import { failWith } from '~/testing/accounts-testing';

function setup(users = new UsersGatewayStub(), invitations = new InvitationsGatewayStub()) {
  TestBed.configureTestingModule({
    providers: [provideAccessStubs(users, invitations), AccessAdminFacade],
  });
  const facade = TestBed.inject(AccessAdminFacade);
  const notices: AccessNotice[] = [];
  facade.notices$.subscribe((notice) => notices.push(notice));
  return { facade, users, invitations, notices };
}

describe('AccessAdminFacade', () => {
  describe('carregar', () => {
    it('Dado o carregamento, então começa em loading e depois entrega usuários (dono primeiro) e convites (mais novo primeiro)', () => {
      const users = new UsersGatewayStub();
      const invitations = new InvitationsGatewayStub();
      const usersSubject = new Subject<never[]>();
      users.listResult = usersSubject;
      const { facade } = setup(users, invitations);
      invitations.invitations = [
        anInvitation({ id: 'a', createdAt: '2026-10-01T00:00:00Z' }),
        anInvitation({ id: 'b', createdAt: '2026-10-05T00:00:00Z' }),
      ];

      facade.load();

      expect(facade.users().status).toBe('loading');
      const invs = facade.invitations();
      expect(invs.status === 'ready' && invs.data.map((i) => i.id)).toEqual(['b', 'a']);
    });

    it('Dado que usuários carregam e convites falham, então a parte boa aparece e só a ruim tem erro', () => {
      const invitations = new InvitationsGatewayStub();
      invitations.listResult = failWith(500, 'INTERNAL_ERROR');
      const { facade } = setup(new UsersGatewayStub(), invitations);

      facade.load();

      expect(facade.users().status).toBe('ready');
      expect(facade.invitations().status).toBe('error');
      expect(facade.forbidden()).toBe(false);
    });

    it('Dado 403 em uma das listas, então sinaliza sem permissão', () => {
      const users = new UsersGatewayStub();
      users.listResult = failWith(403, 'FORBIDDEN');
      const { facade } = setup(users);

      facade.load();

      expect(facade.forbidden()).toBe(true);
    });

    it('Dado erro só nos convites, quando tenta de novo, então recarrega só os convites', () => {
      const invitations = new InvitationsGatewayStub();
      invitations.listResult = failWith(500, 'INTERNAL_ERROR');
      const { facade, users } = setup(new UsersGatewayStub(), invitations);
      facade.load();
      invitations.listResult = null;
      users.calls.length = 0;

      facade.reloadInvitations();

      expect(facade.invitations().status).toBe('ready');
      expect(users.calls).toEqual([]);
    });
  });

  describe('convidar', () => {
    it('Dado e-mail válido, quando convida, então insere o convite devolvido pela API e avisa', () => {
      const { facade, invitations, notices } = setup();
      facade.load();

      facade.invite('novo@moneylog.app');

      expect(invitations.calls).toContain('create:novo@moneylog.app');
      const list = facade.invitations();
      expect(list.status === 'ready' && list.data.map((i) => i.id)).toEqual(['inv-new']);
      expect(notices.map((n) => n.kind)).toEqual(['invited']);
      expect(facade.inviteState().status).toBe('idle');
    });

    it('Dado um envio em andamento, quando convida de novo, então ignora (sem duplo envio)', () => {
      const invitations = new InvitationsGatewayStub();
      invitations.next = NEVER;
      const { facade } = setup(new UsersGatewayStub(), invitations);
      facade.load();

      facade.invite('a@b.co');
      facade.invite('a@b.co');

      expect(invitations.calls.filter((c) => c.startsWith('create'))).toHaveLength(1);
      expect(facade.inviting()).toBe(true);
    });

    it('Dado 409 INVITATION_PENDING, então guarda o problem com o invitationId e recarrega os convites', () => {
      const invitations = new InvitationsGatewayStub();
      const { facade } = setup(new UsersGatewayStub(), invitations);
      facade.load();
      invitations.next = failWithInvitation(409, 'INVITATION_PENDING', 'inv-9');

      facade.invite('a@b.co');

      const state = facade.inviteState();
      expect(state.status === 'failed' && state.problem.invitationId).toBe('inv-9');
      expect(invitations.calls.filter((c) => c === 'list')).toHaveLength(2);
    });

    it('Dado 502 EMAIL_DELIVERY_FAILED, então recarrega os convites do backend (sem duplicar) e mantém o problema', () => {
      const invitations = new InvitationsGatewayStub();
      const { facade } = setup(new UsersGatewayStub(), invitations);
      facade.load();
      invitations.next = failWithInvitation(502, 'EMAIL_DELIVERY_FAILED', 'inv-7');
      invitations.invitations = [anInvitation({ id: 'inv-7', deliveryStatus: 'FAILED' })];

      facade.invite('a@b.co');

      const list = facade.invitations();
      expect(list.status === 'ready' && list.data).toEqual([
        expect.objectContaining({ id: 'inv-7', deliveryStatus: 'FAILED' }),
      ]);
      const state = facade.inviteState();
      expect(state.status === 'failed' && state.problem.code).toBe('EMAIL_DELIVERY_FAILED');
    });

    it('Dado 404 INVITATIONS_DISABLED, então marca o recurso como indisponível', () => {
      const invitations = new InvitationsGatewayStub();
      const { facade } = setup(new UsersGatewayStub(), invitations);
      facade.load();
      invitations.next = failWith(404, 'INVITATIONS_DISABLED');

      facade.invite('a@b.co');

      expect(facade.invitationsUnavailable()).toBe(true);
    });

    it('Dado um problema anterior, quando limpa, então volta a idle', () => {
      const invitations = new InvitationsGatewayStub();
      const { facade } = setup(new UsersGatewayStub(), invitations);
      invitations.next = failWith(409, 'USER_LIMIT_REACHED');
      facade.invite('a@b.co');

      facade.clearInviteProblem();

      expect(facade.inviteState().status).toBe('idle');
    });
  });

  describe('ações por item', () => {
    function seeded() {
      const users = new UsersGatewayStub();
      users.users = [OWNER_MANAGED, aManagedUser({ id: 'user-2' })];
      const invitations = new InvitationsGatewayStub();
      invitations.invitations = [
        anInvitation({ id: 'inv-1', status: 'EXPIRED' }),
        anInvitation({ id: 'inv-2', createdAt: '2026-10-17T00:00:00Z' }),
      ];
      const ctx = setup(users, invitations);
      ctx.facade.load();
      return ctx;
    }

    function statusOf(
      state: ReturnType<AccessAdminFacade['invitations']> | ReturnType<AccessAdminFacade['users']>,
      id: string,
    ) {
      return state.status === 'ready'
        ? (state.data as readonly { id: string; status: string }[]).find((i) => i.id === id)?.status
        : undefined;
    }

    it('Dado reenviar, então o item mostra o estado devolvido pela API e avisa', () => {
      const { facade, notices } = seeded();

      facade.resend('inv-1');

      expect(statusOf(facade.invitations(), 'inv-1')).toBe('PENDING');
      expect(notices.at(-1)?.kind).toBe('resent');
      expect(facade.busyIds().size).toBe(0);
    });

    it('Dado revogar, então o item vira REVOKED com a resposta da API', () => {
      const { facade } = seeded();

      facade.revoke('inv-2');

      expect(statusOf(facade.invitations(), 'inv-2')).toBe('REVOKED');
    });

    it('Dado desativar e reativar, então o usuário mostra DISABLED e depois ACTIVE', () => {
      const { facade } = seeded();

      facade.disable('user-2');
      expect(statusOf(facade.users(), 'user-2')).toBe('DISABLED');

      facade.enable('user-2');
      expect(statusOf(facade.users(), 'user-2')).toBe('ACTIVE');
    });

    it('Dado ação em andamento no item, então ele fica ocupado e uma segunda ação nele é ignorada', () => {
      const { facade, invitations } = seeded();
      invitations.next = NEVER;

      facade.revoke('inv-2');
      facade.revoke('inv-2');

      expect(facade.busyIds().has('inv-2')).toBe(true);
      expect(invitations.calls.filter((c) => c === 'revoke:inv-2')).toHaveLength(1);
    });

    it('Dado 409 INVITATION_NOT_RESENDABLE, então avisa a falha e recarrega os convites do backend', () => {
      const { facade, notices, invitations } = seeded();
      invitations.next = failWith(409, 'INVITATION_NOT_RESENDABLE');

      facade.resend('inv-1');

      const last = notices.at(-1);
      expect(last?.kind === 'failed' && last.problem.code).toBe('INVITATION_NOT_RESENDABLE');
      expect(invitations.calls.filter((c) => c === 'list')).toHaveLength(2);
      expect(facade.busyIds().size).toBe(0);
    });

    it('Dado resend de EXPIRED com EMAIL_ALREADY_REGISTERED, então recarrega convites e usuários', () => {
      const { facade, invitations, users } = seeded();
      invitations.next = failWith(409, 'EMAIL_ALREADY_REGISTERED');

      facade.resend('inv-1');

      expect(invitations.calls.filter((c) => c === 'list')).toHaveLength(2);
      expect(users.calls.filter((c) => c === 'list')).toHaveLength(2);
    });

    it('Dado 409 CANNOT_DISABLE_OWNER, então avisa a falha com o código do contrato', () => {
      const { facade, notices, users } = seeded();
      users.next = failWith(409, 'CANNOT_DISABLE_OWNER');

      facade.disable(OWNER_MANAGED.id);

      const last = notices.at(-1);
      expect(last?.kind === 'failed' && last.problem.code).toBe('CANNOT_DISABLE_OWNER');
    });
  });
});

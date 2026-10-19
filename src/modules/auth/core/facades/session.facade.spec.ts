import { TestBed } from '@angular/core/testing';
import { delay, firstValueFrom, NEVER, of, Subject, throwError } from 'rxjs';

import { LAST_USER_KEY, SessionFacade } from '~/modules/auth/core/facades/session.facade';
import {
  SESSION_END_HOOKS,
  SESSION_LOCAL_RESET_HOOKS,
  type SessionEndHook,
} from '~/modules/auth/core/interfaces/session-end-hook';
import { AuthFailure } from '~/modules/auth/core/types/auth-failure';
import type { AuthToken } from '~/modules/auth/core/types/auth-token';
import {
  aToken,
  AuthGatewayStub,
  MEMBER_USER,
  OWNER_USER,
  provideAuthStub,
} from '~/testing/auth-testing';

beforeEach(() => localStorage.clear());

function setup(hook?: SessionEndHook, localHook?: SessionEndHook) {
  const gateway = new AuthGatewayStub();
  TestBed.configureTestingModule({
    providers: [
      provideAuthStub(gateway),
      ...(localHook ? [{ provide: SESSION_LOCAL_RESET_HOOKS, useValue: [localHook] }] : []),
      ...(hook ? [{ provide: SESSION_END_HOOKS, useValue: [hook] }] : []),
    ],
  });
  return { gateway, session: TestBed.inject(SessionFacade) };
}

describe('SessionFacade', () => {
  describe('login', () => {
    it('Dado credenciais certas, então autentica, guarda o token só em memória e avisa o sucesso', () => {
      const { gateway, session } = setup();
      let signedIn = 0;
      session.signedIn$.subscribe(() => signedIn++);

      session.login({ email: 'dono@moneylog.app', password: 'segredo' });

      expect(gateway.logins).toEqual([{ email: 'dono@moneylog.app', password: 'segredo' }]);
      expect(session.status()).toBe('authenticated');
      expect(session.token()).toBe('token-1');
      expect(session.loginState()).toEqual({ status: 'idle' });
      expect(signedIn).toBe(1);
      expect(JSON.stringify({ ...localStorage })).not.toContain('token-1');
      expect(JSON.stringify({ ...sessionStorage })).not.toContain('token-1');
      expect(Object.keys({ ...localStorage })).toEqual([LAST_USER_KEY]);
      expect(sessionStorage.length).toBe(0);
    });

    it('Dado credenciais erradas, então expõe a falha, não autentica e não avisa sucesso', () => {
      const { gateway, session } = setup();
      gateway.login$ = throwError(() => new AuthFailure('invalid_credentials'));
      let signedIn = 0;
      session.signedIn$.subscribe(() => signedIn++);

      session.login({ email: 'a@b.c', password: 'x' });

      expect(session.status()).toBe('unknown');
      expect(session.token()).toBeNull();
      expect(signedIn).toBe(0);
      const state = session.loginState();
      expect(state.status === 'failed' && state.failure.reason).toBe('invalid_credentials');
    });

    it('Dado erro que não é AuthFailure, então vira "unavailable"', () => {
      const { gateway, session } = setup();
      gateway.login$ = throwError(() => new Error('boom'));

      session.login({ email: 'a@b.c', password: 'x' });

      const state = session.loginState();
      expect(state.status === 'failed' && state.failure.reason).toBe('unavailable');
    });

    it('Dado um login em andamento, quando envio de novo, então só uma requisição sai (exhaustMap)', () => {
      const { gateway, session } = setup();
      const pending = new Subject<AuthToken>();
      gateway.login$ = pending;

      session.login({ email: 'a@b.c', password: '1' });
      session.login({ email: 'a@b.c', password: '2' });

      expect(gateway.logins).toHaveLength(1);
      expect(session.loginState().status).toBe('submitting');

      pending.next(aToken());
      pending.complete();
      expect(session.status()).toBe('authenticated');
    });
  });

  describe('restore (refresh silencioso do boot)', () => {
    it('Dado o cookie válido, então autentica antes de ativar as rotas', async () => {
      const { gateway, session } = setup();

      await session.restore();

      expect(gateway.refreshes).toBe(1);
      expect(session.status()).toBe('authenticated');
      expect(session.token()).toBe('token-2');
    });

    it('Dado 401 no refresh, então fica anônima', async () => {
      const { gateway, session } = setup();
      gateway.refresh$ = throwError(() => new AuthFailure('refresh_invalid'));

      await session.restore();

      expect(session.status()).toBe('anonymous');
      expect(session.token()).toBeNull();
    });

    it.each(['network', 'unavailable'] as const)(
      'Dado erro "%s" no refresh do boot, então não limpa nem expulsa: fica "unreachable" (S-93)',
      async (reason) => {
        const { gateway, session } = setup();
        gateway.refresh$ = throwError(() => new AuthFailure(reason));

        await session.restore();

        expect(session.status()).toBe('unreachable');
      },
    );
  });

  describe('refresh único', () => {
    it('Dado três pedidos de refresh em paralelo, então só um POST sai e todos recebem o mesmo token', async () => {
      const { gateway, session } = setup();
      const pending = new Subject<AuthToken>();
      gateway.refresh$ = pending;

      const results = Promise.all([
        firstValueFrom(session.refresh()),
        firstValueFrom(session.refresh()),
        firstValueFrom(session.refresh()),
      ]);
      pending.next(aToken('novo'));
      pending.complete();

      expect(await results).toEqual(['novo', 'novo', 'novo']);
      expect(gateway.refreshes).toBe(1);
    });

    it('Dado um refresh terminado, então o próximo pedido faz outro POST', async () => {
      const { gateway, session } = setup();

      await firstValueFrom(session.refresh());
      await firstValueFrom(session.refresh());

      expect(gateway.refreshes).toBe(2);
    });

    it('Dado o token já renovado por outra requisição, então reaproveita-o sem novo refresh', async () => {
      const { gateway, session } = setup();
      session.login({ email: 'a@b.c', password: 'x' });

      const token = await firstValueFrom(session.refreshAfterUnauthorized('token-antigo'));

      expect(token).toBe('token-1');
      expect(gateway.refreshes).toBe(0);
    });

    it('Dado o mesmo token que falhou, então renova', async () => {
      const { gateway, session } = setup();
      session.login({ email: 'a@b.c', password: 'x' });

      const token = await firstValueFrom(session.refreshAfterUnauthorized('token-1'));

      expect(token).toBe('token-2');
      expect(gateway.refreshes).toBe(1);
    });

    it('Dado erro no refresh, então propaga AuthFailure e libera o próximo pedido', async () => {
      const { gateway, session } = setup();
      gateway.refresh$ = throwError(() => new AuthFailure('network'));

      await expect(firstValueFrom(session.refresh())).rejects.toMatchObject({ reason: 'network' });
      gateway.refresh$ = of(aToken('depois'));

      expect(await firstValueFrom(session.refresh())).toBe('depois');
    });
  });

  describe('logout', () => {
    it('Dado a sessão, quando saio, então chama o logout, apaga o token e fica anônima', async () => {
      const { gateway, session } = setup();
      session.login({ email: 'a@b.c', password: 'x' });

      await firstValueFrom(session.logout());

      expect(gateway.logouts).toBe(1);
      expect(session.token()).toBeNull();
      expect(session.status()).toBe('anonymous');
    });

    it('Dado o logout falhando (offline), então a sessão local é limpa do mesmo jeito', async () => {
      const { gateway, session } = setup();
      session.login({ email: 'a@b.c', password: 'x' });
      gateway.logout$ = throwError(() => new AuthFailure('network'));

      await firstValueFrom(session.logout());

      expect(session.token()).toBeNull();
      expect(session.status()).toBe('anonymous');
    });

    it('Dado um gancho de fim de sessão, quando saio, então ele roda antes do logout', async () => {
      const order: string[] = [];
      const { gateway, session } = setup(() => {
        order.push(session.token() ? 'hook-com-token' : 'hook-sem-token');
        return of(undefined);
      });
      session.login({ email: 'a@b.c', password: 'x' });

      await firstValueFrom(session.logout());

      expect(order).toEqual(['hook-com-token']);
      expect(gateway.logouts).toBe(1);
      expect(session.status()).toBe('anonymous');
    });

    it('Dado o gancho falhando, então o logout segue normalmente', async () => {
      const { gateway, session } = setup(() => throwError(() => new Error('offline')));
      session.login({ email: 'a@b.c', password: 'x' });

      await firstValueFrom(session.logout());

      expect(gateway.logouts).toBe(1);
      expect(session.status()).toBe('anonymous');
    });

    it('Dado o logout sem resposta ainda, então a sessão só é limpa quando termina', () => {
      const { gateway, session } = setup();
      session.login({ email: 'a@b.c', password: 'x' });
      gateway.logout$ = NEVER;

      session.logout().subscribe();

      expect(session.token()).toBe('token-1');
    });
  });

  describe('primeiro acesso', () => {
    it('Dado o setup certo, então autentica e avisa o sucesso', () => {
      const { gateway, session } = setup();
      let signedIn = 0;
      session.signedIn$.subscribe(() => signedIn++);

      session.setupPassword({ email: 'a@b.c', setupCode: 'C', newPassword: 'N' });

      expect(gateway.setups).toHaveLength(1);
      expect(session.authenticated()).toBe(true);
      expect(session.token()).toBe('token-setup');
      expect(signedIn).toBe(1);
    });

    it('Dado a falha, então guarda o motivo e não autentica', () => {
      const { gateway, session } = setup();
      gateway.setup$ = throwError(() => new AuthFailure('invalid_setup_code'));

      session.setupPassword({ email: 'a@b.c', setupCode: 'C', newPassword: 'N' });

      expect(session.setupState()).toMatchObject({
        status: 'failed',
        failure: { reason: 'invalid_setup_code' },
      });
      expect(session.authenticated()).toBe(false);
    });

    it('Dado clique duplo, então só uma requisição sai enquanto a primeira não termina', () => {
      const { gateway, session } = setup();
      gateway.setup$ = NEVER;

      session.setupPassword({ email: 'a@b.c', setupCode: 'C', newPassword: 'N' });
      session.setupPassword({ email: 'a@b.c', setupCode: 'C', newPassword: 'N' });

      expect(gateway.setups).toHaveLength(1);
    });

    it('Dado falha ao consultar o status, então devolve null em vez de lançar', async () => {
      const { gateway, session } = setup();
      gateway.setupRequired$ = throwError(() => new AuthFailure('network'));

      expect(await firstValueFrom(session.passwordSetupRequired())).toBeNull();
    });
  });

  describe('papel e troca de usuário', () => {
    it('Dado um login de convidado, então expõe usuário e papel MEMBER e não é dono', () => {
      const { gateway, session } = setup();
      gateway.login$ = of(aToken('t', MEMBER_USER));

      session.login({ email: MEMBER_USER.email, password: 'x' });

      expect(session.user()).toEqual(MEMBER_USER);
      expect(session.role()).toBe('MEMBER');
      expect(session.isOwner()).toBe(false);
    });

    it('Dado um login do dono, então isOwner é verdadeiro', () => {
      const { session } = setup();

      session.login({ email: OWNER_USER.email, password: 'x' });

      expect(session.isOwner()).toBe(true);
    });

    it('Dado a sessão limpa, então o papel some', () => {
      const { session } = setup();
      session.login({ email: OWNER_USER.email, password: 'x' });

      session.clear();

      expect(session.user()).toBeNull();
      expect(session.role()).toBeNull();
      expect(session.isOwner()).toBe(false);
    });

    it('Dado logout de A e login de B, então detecta a troca e roda a limpeza local', async () => {
      const localHook = vi.fn(() => of(undefined));
      const { gateway, session } = setup(undefined, localHook);
      session.login({ email: OWNER_USER.email, password: 'x' });
      await firstValueFrom(session.logout());
      gateway.login$ = of(aToken('t2', MEMBER_USER));

      session.login({ email: MEMBER_USER.email, password: 'x' });

      expect(session.signedInAsAnotherUser()).toBe(true);
      expect(session.user()).toEqual(MEMBER_USER);
      expect(localHook).toHaveBeenCalledTimes(1);
    });

    it('Dado logout e novo login do mesmo usuário, então não conta como troca', async () => {
      const localHook = vi.fn(() => of(undefined));
      const { session } = setup(undefined, localHook);
      session.login({ email: OWNER_USER.email, password: 'x' });
      await firstValueFrom(session.logout());

      session.login({ email: OWNER_USER.email, password: 'x' });

      expect(session.signedInAsAnotherUser()).toBe(false);
      expect(localHook).not.toHaveBeenCalled();
    });

    it('Dado o primeiro login do navegador, então não conta como troca', () => {
      const { session } = setup();

      session.login({ email: OWNER_USER.email, password: 'x' });

      expect(session.signedInAsAnotherUser()).toBe(false);
    });

    it('Dado a sessão encerrada pelo servidor (expire), então limpa token e papel e roda só a limpeza local, sem chamar o logout', () => {
      const endHook = vi.fn(() => of(undefined));
      const localHook = vi.fn(() => of(undefined));
      const { gateway, session } = setup(endHook, localHook);
      session.login({ email: OWNER_USER.email, password: 'x' });

      session.expire();

      expect(session.status()).toBe('anonymous');
      expect(session.token()).toBeNull();
      expect(session.role()).toBeNull();
      expect(localHook).toHaveBeenCalledTimes(1);
      expect(endHook).not.toHaveBeenCalled();
      expect(gateway.logouts).toBe(0);
    });

    it('Dado o refresh devolvendo outro usuário, então troca o papel e roda a limpeza local', () => {
      const localHook = vi.fn(() => of(undefined));
      const { gateway, session } = setup(undefined, localHook);
      session.login({ email: OWNER_USER.email, password: 'x' });
      gateway.refresh$ = of(aToken('t3', MEMBER_USER));

      session.refresh().subscribe();

      expect(session.role()).toBe('MEMBER');
      expect(localHook).toHaveBeenCalledTimes(1);
    });

    it('Dado o refresh devolvendo outro usuário, então avisa a troca uma única vez para recarregar o app', () => {
      const { gateway, session } = setup();
      let switches = 0;
      session.userSwitched$.subscribe(() => switches++);
      session.login({ email: OWNER_USER.email, password: 'x' });
      gateway.refresh$ = of(aToken('t3', MEMBER_USER));

      session.refresh().subscribe();

      expect(switches).toBe(1);
    });

    it('Dado a limpeza local lenta, quando o refresh traz outro usuário, então só avisa a troca depois que ela termina', () => {
      vi.useFakeTimers();
      try {
        const slow = vi.fn(() => of(undefined).pipe(delay(500)));
        const { gateway, session } = setup(undefined, slow);
        let switches = 0;
        session.userSwitched$.subscribe(() => switches++);
        session.login({ email: OWNER_USER.email, password: 'x' });
        gateway.refresh$ = of(aToken('t3', MEMBER_USER));

        session.refresh().subscribe();

        expect(switches).toBe(0);
        expect(session.role()).toBe('OWNER');
        vi.advanceTimersByTime(500);
        expect(switches).toBe(1);
        expect(session.role()).toBe('MEMBER');
      } finally {
        vi.useRealTimers();
      }
    });

    it('Dado um hook de limpeza travado, quando o login traz outro usuário, então segue após o timeout', () => {
      vi.useFakeTimers();
      try {
        const { gateway, session } = setup(undefined, () => NEVER);
        session.login({ email: OWNER_USER.email, password: 'x' });
        gateway.refresh$ = of(aToken('t3', MEMBER_USER));
        session.refresh().subscribe();

        vi.advanceTimersByTime(3000);

        expect(session.role()).toBe('MEMBER');
      } finally {
        vi.useRealTimers();
      }
    });

    it('Dado o último usuário guardado no navegador, quando outro entra numa carga nova, então detecta a troca e limpa', async () => {
      localStorage.setItem(LAST_USER_KEY, OWNER_USER.id);
      const localHook = vi.fn(() => of(undefined));
      const { gateway, session } = setup(undefined, localHook);
      gateway.refresh$ = of(aToken('t4', MEMBER_USER));

      await session.restore();

      expect(session.signedInAsAnotherUser()).toBe(true);
      expect(localHook).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem(LAST_USER_KEY)).toBe(MEMBER_USER.id);
    });

    it('Dado a API fora do ar na carga, então o papel fica desconhecido e o dono não é tratado como dono', async () => {
      const { gateway, session } = setup();
      gateway.refresh$ = throwError(() => new AuthFailure('network'));

      await session.restore();

      expect(session.status()).toBe('unreachable');
      expect(session.role()).toBeNull();
      expect(session.isOwner()).toBe(false);
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';

import { InvitationAcceptFacade } from '~/modules/auth/core/facades/invitation-accept.facade';
import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import { AuthFailure } from '~/modules/auth/core/types/auth-failure';
import { AuthGatewayStub, MEMBER_USER, provideAuthStub } from '~/testing/auth-testing';

function setup(gateway = new AuthGatewayStub()) {
  TestBed.configureTestingModule({
    providers: [provideAuthStub(gateway), InvitationAcceptFacade],
  });
  return {
    gateway,
    facade: TestBed.inject(InvitationAcceptFacade),
    session: TestBed.inject(SessionFacade),
  };
}

describe('InvitationAcceptFacade', () => {
  it('Dado um token, quando começa, então chama o preview com ele e mostra o e-mail do convite', () => {
    const { facade, gateway } = setup();

    facade.start('tok-1');

    expect(gateway.previews).toEqual(['tok-1']);
    expect(facade.state()).toEqual({
      status: 'ready',
      email: MEMBER_USER.email,
      expiresAt: '2026-10-25T12:00:00Z',
    });
  });

  it('Dado nenhum token, então é convite inválido e nada é chamado', () => {
    const { facade, gateway } = setup();

    facade.start(null);

    expect(facade.state().status).toBe('invalid');
    expect(gateway.previews).toEqual([]);
  });

  it('Dado um token acima de 200 caracteres, então é inválido sem chamar a API', () => {
    const { facade, gateway } = setup();

    facade.start('x'.repeat(201));

    expect(facade.state().status).toBe('invalid');
    expect(gateway.previews).toEqual([]);
  });

  it('Dado 404 no preview, então é inválido e o token deixa de existir na memória', () => {
    const gateway = new AuthGatewayStub();
    gateway.preview$ = throwError(() => new AuthFailure('invalid_invitation'));
    const { facade } = setup(gateway);

    facade.start('tok-1');
    facade.verify();

    expect(facade.state().status).toBe('invalid');
    expect(gateway.previews).toEqual(['tok-1']);
  });

  it('Dado falha de rede no preview, então fica indisponível, mantém o token e tentar de novo repete o preview', () => {
    const gateway = new AuthGatewayStub();
    gateway.preview$ = throwError(() => new AuthFailure('network'));
    const { facade } = setup(gateway);

    facade.start('tok-1');
    expect(facade.state()).toEqual({ status: 'unavailable', retryAfterSeconds: null });

    gateway.preview$ = of({ email: 'a@b.c', expiresAt: '2026-10-25T12:00:00Z' });
    facade.verify();

    expect(gateway.previews).toEqual(['tok-1', 'tok-1']);
    expect(facade.state().status).toBe('ready');
  });

  it('Dado 429 no preview, então guarda o Retry-After', () => {
    const gateway = new AuthGatewayStub();
    gateway.preview$ = throwError(() => new AuthFailure('rate_limited', 90));
    const { facade } = setup(gateway);

    facade.start('tok-1');

    expect(facade.state()).toEqual({ status: 'unavailable', retryAfterSeconds: 90 });
  });

  it('Dado o aceite com sucesso, então abre a sessão do convidado e conclui', () => {
    const { facade, gateway, session } = setup();
    facade.start('tok-1');

    facade.submit('uma senha bem longa');

    expect(gateway.accepts).toEqual([{ token: 'tok-1', password: 'uma senha bem longa' }]);
    expect(session.authenticated()).toBe(true);
    expect(session.role()).toBe('MEMBER');
    expect(facade.state().status).toBe('done');
  });

  it('Dado 422 WEAK_PASSWORD, então mantém o formulário pronto e o token para nova tentativa', () => {
    const gateway = new AuthGatewayStub();
    gateway.accept$ = throwError(() => new AuthFailure('weak_password'));
    const { facade } = setup(gateway);
    facade.start('tok-1');

    facade.submit('curta');

    expect(facade.state().status).toBe('ready');
    const submit = facade.submitState();
    expect(submit.status === 'failed' && submit.failure.reason).toBe('weak_password');
  });

  it('Dado 404 no aceite, então vira convite inválido', () => {
    const gateway = new AuthGatewayStub();
    gateway.accept$ = throwError(() => new AuthFailure('invalid_invitation'));
    const { facade } = setup(gateway);
    facade.start('tok-1');

    facade.submit('uma senha bem longa');

    expect(facade.state().status).toBe('invalid');
  });

  it('Dado um envio em andamento, quando envia de novo, então ignora o segundo (sem duplo aceite)', () => {
    const gateway = new AuthGatewayStub();
    gateway.accept$ = NEVER;
    const { facade } = setup(gateway);
    facade.start('tok-1');

    facade.submit('uma senha bem longa');
    facade.submit('uma senha bem longa');

    expect(gateway.accepts).toHaveLength(1);
    expect(facade.submitting()).toBe(true);
  });

  describe('com sessão aberta no aparelho', () => {
    async function withSession() {
      const ctx = setup();
      await ctx.session.restore();
      return ctx;
    }

    it('Dado usuário logado, então não chama o preview nem descarta a sessão: pergunta primeiro', async () => {
      const { facade, gateway, session } = await withSession();

      facade.start('tok-1');

      expect(facade.state().status).toBe('existing_session');
      expect(gateway.previews).toEqual([]);
      expect(session.authenticated()).toBe(true);
    });

    it('Dado "sair e usar o convite", então encerra a sessão e segue para o preview com o mesmo token', async () => {
      const { facade, gateway, session } = await withSession();
      facade.start('tok-1');

      facade.signOutAndContinue();

      expect(gateway.logouts).toBe(1);
      expect(session.authenticated()).toBe(false);
      expect(gateway.previews).toEqual(['tok-1']);
      expect(facade.state().status).toBe('ready');
    });

    it('Dado "continuar com a conta atual", então descarta o token e mantém a sessão', async () => {
      const { facade, gateway, session } = await withSession();
      facade.start('tok-1');

      facade.keepCurrentSession();

      expect(facade.state().status).toBe('discarded');
      expect(gateway.previews).toEqual([]);
      expect(session.authenticated()).toBe(true);
    });
  });
});

import { expect, seedPreferences, test } from '../support';

import { createStub, installStub, MEMBER, OWNER } from './api-stub';

const TOKEN = 'token-de-teste-do-convite';
const STRONG_PASSWORD = 'uma-senha-bem-longa-123';

async function openInvitation(
  page: import('@playwright/test').Page,
  stub: ReturnType<typeof createStub>,
): Promise<void> {
  await seedPreferences(page, { language: 'pt' });
  await installStub(page, stub);
  await page.goto(`/convite#${TOKEN}`);
}

async function fillPasswords(
  page: import('@playwright/test').Page,
  password: string,
  confirm = password,
): Promise<void> {
  await page.locator('[data-cy="invitation-password"]').fill(password);
  await page.locator('[data-cy="invitation-confirm-password"]').fill(confirm);
  await page.locator('[data-cy="invitation-submit"]').click();
}

test.describe('aceite do convite', () => {
  test('Dado o link com token no fragmento, Quando a tela abre, Então o token sai da URL e o preview mostra o e-mail', async ({
    page,
  }) => {
    const stub = createStub({ session: null });
    await openInvitation(page, stub);

    await expect(page.locator('[data-cy="invitation-form"]')).toBeVisible();
    await expect(page.locator('[data-cy="invitation-email"]')).toContainText(MEMBER.email);
    await expect(page.locator('[data-cy="invitation-valid-until"]')).toBeVisible();
    await expect(page.locator('[data-cy="invitation-privacy"]')).toBeVisible();
    await expect(page.locator('[data-cy="invitation-acceptance"]')).toBeVisible();
    expect(page.url()).not.toContain(TOKEN);
    expect(page.url()).not.toContain('#');
    expect(stub.callsTo('POST', '/v1/invitations/preview')[0]?.body).toEqual({ token: TOKEN });
    expect(await page.evaluate(() => document.location.hash)).toBe('');
  });

  test('Dado um token inválido (404), Quando a tela abre, Então mostra convite inválido com saída para a entrada', async ({
    page,
  }) => {
    const stub = createStub({ session: null });
    stub.fail('POST /v1/invitations/preview', { status: 404, code: 'INVALID_INVITATION' });
    await openInvitation(page, stub);

    await expect(page.locator('[data-cy="invitation-invalid"]')).toBeVisible();
    await page.locator('[data-cy="invitation-go-login"]').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Dado a página sem token, Quando abre /convite, Então mostra convite inválido sem chamar a API', async ({
    page,
  }) => {
    const stub = createStub({ session: null });
    await seedPreferences(page, { language: 'pt' });
    await installStub(page, stub);

    await page.goto('/convite');

    await expect(page.locator('[data-cy="invitation-invalid"]')).toBeVisible();
    expect(stub.callsTo('POST', '/v1/invitations/preview')).toHaveLength(0);
  });

  test('Dado 5xx no preview, Quando tenta de novo, Então o convite continua guardado e o preview funciona', async ({
    page,
  }) => {
    const stub = createStub({ session: null });
    stub.fail('POST /v1/invitations/preview', { status: 503 });
    await openInvitation(page, stub);

    await expect(page.locator('[data-cy="invitation-unavailable"]')).toBeVisible();
    stub.failures.clear();
    await page.locator('[data-cy="invitation-retry"]').click();

    await expect(page.locator('[data-cy="invitation-form"]')).toBeVisible();
    expect(stub.callsTo('POST', '/v1/invitations/preview')).toHaveLength(2);
    expect(stub.callsTo('POST', '/v1/invitations/preview')[1]?.body).toEqual({ token: TOKEN });
  });

  test('Dado 429 no preview, Quando a tela abre, Então informa o tempo de espera em vez de convite inválido', async ({
    page,
  }) => {
    const stub = createStub({ session: null });
    stub.fail('POST /v1/invitations/preview', {
      status: 429,
      code: 'TOO_MANY_ATTEMPTS',
      retryAfter: 120,
    });
    await openInvitation(page, stub);

    await expect(page.locator('[data-cy="invitation-unavailable"]')).toContainText('2 min');
    await expect(page.locator('[data-cy="invitation-invalid"]')).toHaveCount(0);
  });

  test('Dado senhas que não conferem, Quando envia, Então não chama o aceite', async ({ page }) => {
    const stub = createStub({ session: null });
    await openInvitation(page, stub);
    await expect(page.locator('[data-cy="invitation-form"]')).toBeVisible();

    await fillPasswords(page, STRONG_PASSWORD, 'outra-senha-diferente');

    await expect(page.locator('[data-cy="invitation-form"]')).toBeVisible();
    expect(stub.callsTo('POST', '/v1/invitations/accept')).toHaveLength(0);
  });

  test('Dado uma senha curta, Quando digita, Então a regra de tamanho segue pendente', async ({
    page,
  }) => {
    const stub = createStub({ session: null });
    await openInvitation(page, stub);
    await expect(page.locator('[data-cy="invitation-form"]')).toBeVisible();

    await page.locator('[data-cy="invitation-password"]').fill('curta');
    await expect(page.locator('[data-cy="invitation-rule-length"]')).not.toHaveClass(/met/);

    await page.locator('[data-cy="invitation-password"]').fill(STRONG_PASSWORD);
    await expect(page.locator('[data-cy="invitation-rule-length"]')).toHaveClass(/met/);
  });

  test('Dado WEAK_PASSWORD do servidor, Quando envia, Então mostra o erro, mantém o convite e aceita uma senha melhor', async ({
    page,
  }) => {
    const stub = createStub({ session: null });
    stub.fail('POST /v1/invitations/accept', { status: 422, code: 'WEAK_PASSWORD' });
    await openInvitation(page, stub);
    await expect(page.locator('[data-cy="invitation-form"]')).toBeVisible();

    await fillPasswords(page, STRONG_PASSWORD);
    await expect(page.locator('[data-cy="invitation-error"]')).toContainText(
      'Essa senha não foi aceita',
    );
    await expect(page.locator('[data-cy="invitation-form"]')).toBeVisible();

    stub.failures.clear();
    await fillPasswords(page, 'outra-senha-forte-456');
    await expect(page).toHaveURL(/\/$/);
  });

  test('Dado um aceite válido, Quando envia a senha, Então entra como convidado e não vê a área do dono', async ({
    page,
  }) => {
    const stub = createStub({ session: null });
    await openInvitation(page, stub);
    await expect(page.locator('[data-cy="invitation-form"]')).toBeVisible();

    await fillPasswords(page, STRONG_PASSWORD);

    await expect(page).toHaveURL(/\/$/);
    expect(stub.callsTo('POST', '/v1/invitations/accept')[0]?.body).toEqual({
      token: TOKEN,
      password: STRONG_PASSWORD,
    });
    await page.goto('/settings');
    await expect(page.locator('[data-cy="settings-sign-out"]')).toBeVisible();
    await expect(page.locator('[data-cy="settings-users-link"]')).toHaveCount(0);
    await page.goto('/users');
    await expect(page).toHaveURL(/\/$/);
  });

  test('Dado uma sessão já aberta, Quando abre o convite, Então pergunta antes e não consulta o preview', async ({
    page,
  }) => {
    const stub = createStub({ session: OWNER });
    await openInvitation(page, stub);

    await expect(page.locator('[data-cy="invitation-existing-session"]')).toBeVisible();
    expect(stub.callsTo('POST', '/v1/invitations/preview')).toHaveLength(0);
    expect(page.url()).not.toContain(TOKEN);
  });

  test('Dado uma sessão já aberta, Quando escolhe sair e usar o convite, Então encerra a sessão e mostra o aceite', async ({
    page,
  }) => {
    const stub = createStub({ session: OWNER });
    await openInvitation(page, stub);

    await page.locator('[data-cy="invitation-sign-out-and-use"]').click();

    await expect(page.locator('[data-cy="invitation-form"]')).toBeVisible();
    expect(stub.callsTo('POST', '/v1/auth/logout')).toHaveLength(1);
    expect(stub.callsTo('POST', '/v1/invitations/preview')).toHaveLength(1);
  });

  test('Dado uma sessão já aberta, Quando escolhe continuar com a conta atual, Então descarta o convite', async ({
    page,
  }) => {
    const stub = createStub({ session: OWNER });
    await openInvitation(page, stub);

    await page.locator('[data-cy="invitation-keep-session"]').click();

    await expect(page).toHaveURL(/\/$/);
    expect(stub.callsTo('POST', '/v1/invitations/preview')).toHaveLength(0);
    expect(stub.callsTo('POST', '/v1/invitations/accept')).toHaveLength(0);
  });

  test('Dado dados do dono no aparelho, Quando outro usuário aceita o convite, Então a memória do dono é limpa', async ({
    page,
  }) => {
    const stub = createStub({ session: null });
    await seedPreferences(page, { language: 'pt' });
    await page.addInitScript(
      ([ownerId]) => {
        if (sessionStorage.getItem('seeded')) return;
        sessionStorage.setItem('seeded', '1');
        localStorage.setItem('moneylog.lastUserId', ownerId!);
        localStorage.setItem('moneylog.quickAdd.lastCardId', 'cartao-do-dono');
        localStorage.setItem('moneylog.quickAdd.lastAccountId', 'conta-do-dono');
        localStorage.setItem('moneylog.home.featuredCardId', 'cartao-destaque-do-dono');
      },
      [OWNER.id],
    );
    await installStub(page, stub);
    await page.goto(`/convite#${TOKEN}`);
    await expect(page.locator('[data-cy="invitation-form"]')).toBeVisible();

    await fillPasswords(page, STRONG_PASSWORD);

    await expect(page).toHaveURL(/\/$/);
    await expect
      .poll(() =>
        page.evaluate(() => [
          localStorage.getItem('moneylog.quickAdd.lastCardId'),
          localStorage.getItem('moneylog.quickAdd.lastAccountId'),
          localStorage.getItem('moneylog.home.featuredCardId'),
          localStorage.getItem('moneylog.lastUserId'),
        ]),
      )
      .toEqual([null, null, null, MEMBER.id]);
  });
});

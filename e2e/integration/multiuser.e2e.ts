/* eslint-disable @typescript-eslint/no-explicit-any */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Page } from '@playwright/test';

import { Api, FailureSink } from '../support/api';

import { cy, expect, open, resetDatabase, test } from './fixtures';

const OWNER_ACCOUNT = 'Conta exclusiva do dono';
const MEMBER_ACCOUNT = 'Conta exclusiva do membro';
const MEMBER_PASSWORD = 'senha-do-membro-456';
const MEMBER_EMAIL = `membro-${Date.now()}@moneylog.test`;
const BACKEND_LOG =
  process.env['E2E_BACKEND_LOG'] ?? resolve(__dirname, '..', '.results', 'backend.log');
const INVITATION_LINK = /Link do convite \(somente dev[^)]*\): \S+\/convite#([A-Za-z0-9_-]+)/g;

function logSize(): number {
  return existsSync(BACKEND_LOG) ? statSync(BACKEND_LOG).size : 0;
}

async function invitationTokenSince(offset: number): Promise<string> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const text = readFileSync(BACKEND_LOG).subarray(offset).toString('utf8');
    const found = [...text.matchAll(INVITATION_LINK)].at(-1);
    if (found?.[1]) return found[1];
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(
    'link do convite não apareceu no log do backend (perfil dev com MAIL_PROVIDER=log; E2E_BACKEND_LOG aponta outro arquivo)',
  );
}

async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await cy(page, 'login-email').fill(email);
  await cy(page, 'login-password').fill(password);
  await cy(page, 'login-submit').click();
}

async function browserStorageDump(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const local = JSON.stringify({ ...localStorage });
    const session = JSON.stringify({ ...sessionStorage });
    const idb = (await indexedDB.databases?.()) ?? [];
    const idbNames = JSON.stringify(idb.map((d) => d.name));
    return `${local}${session}${idbNames}`;
  });
}

test.describe.configure({ mode: 'serial' });

test.describe('multiusuário com backend real', () => {
  let ownerAccountId = '';
  let memberUserId = '';
  let ownerApi: Api;
  const sink: FailureSink = [];

  test.beforeAll(() => resetDatabase());

  test('Dado o dono, Quando convida pela tela e o convidado aceita, Então entra como MEMBER sem ver nada do dono e sem acesso a /users, /ai e /mcp', async ({
    page,
    browser,
    api,
    signIn,
    net,
    baseURL,
  }) => {
    net.allow(401, 403, 404);
    ownerApi = api;
    ownerAccountId = (await api.createAccount({ name: OWNER_ACCOUNT, openingBalance: '100.00' }))
      .id;

    await signIn(page);
    await open(page, '/users');
    await expect(cy(page, 'invite-form')).toBeVisible();
    const offset = logSize();
    await cy(page, 'invite-email').fill(MEMBER_EMAIL);
    await cy(page, 'invite-submit').click();
    await expect(cy(page, 'invitations-list')).toContainText(MEMBER_EMAIL);
    const token = await invitationTokenSince(offset);

    const context = await browser.newContext({
      baseURL,
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const member = await context.newPage();
    await member.goto(`/convite#${token}`);
    await expect(cy(member, 'invitation-email')).toContainText(MEMBER_EMAIL);
    expect(member.url()).not.toContain(token);
    await cy(member, 'invitation-password').fill(MEMBER_PASSWORD);
    await cy(member, 'invitation-confirm-password').fill(MEMBER_PASSWORD);
    await cy(member, 'invitation-submit').click();
    await expect(member).toHaveURL(/\/$/);

    await open(member, '/settings');
    await expect(cy(member, 'sidebar-signOut')).toBeVisible();
    await expect(cy(member, 'settings-users-link')).toHaveCount(0);

    await open(member, '/accounts');
    await expect(cy(member, 'empty-state')).toBeVisible();
    await expect(member.locator('body')).not.toContainText(OWNER_ACCOUNT);

    for (const path of ['/users', '/ai', '/mcp']) {
      await member.goto(path);
      await expect(member).toHaveURL(/\/$/);
    }

    const memberApi = new Api(context.request, sink);
    const login = await memberApi.login(MEMBER_EMAIL, MEMBER_PASSWORD);
    memberUserId = login.body.user?.id ?? '';
    expect((await memberApi.ok(memberApi.get('/v1/accounts'))).items).toEqual([]);
    expect((await memberApi.get(`/v1/accounts/${ownerAccountId}`)).status).toBe(404);
    expect((await memberApi.get('/v1/users')).status).toBe(403);
    expect((await memberApi.get('/v1/invitations')).status).toBe(403);
    expect(
      (await memberApi.call('GET', '/v1/ai/analyses', undefined, { validate: false })).status,
    ).toBe(403);
    expect(
      (await memberApi.call('GET', '/v1/settings/ai', undefined, { validate: false })).status,
    ).toBe(403);

    const users = await ownerApi.ok(ownerApi.get('/v1/users'));
    const created = users.find((u: any) => u.email === MEMBER_EMAIL);
    expect(created?.role).toBe('MEMBER');
    memberUserId = created.id;
    expect(sink.map((f) => `${f.where}: ${f.detail}`)).toEqual([]);
    await context.close();
  });

  test('Dado o membro logado, Quando o dono o desativa no meio da sessão, Então o próximo request dá 401, a sessão encerra com aviso e, ao reativar, o login volta', async ({
    page,
    browser,
    api,
    signIn,
    net,
    baseURL,
  }) => {
    net.allow(401, 403);
    await signIn(page);
    await open(page, '/users');

    const context = await browser.newContext({
      baseURL,
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const member = await context.newPage();
    await member.goto('/login');
    await loginAs(member, MEMBER_EMAIL, MEMBER_PASSWORD);
    await expect(member).toHaveURL(/\/$/);
    await waitReady(member);

    await expect(cy(page, `user-disable-${memberUserId}`)).toBeVisible();
    await cy(page, `user-disable-${memberUserId}`).click();
    await cy(page, 'confirm-dialog-confirm').click();
    await expect(cy(page, `user-status-${memberUserId}`)).toHaveText('Desativado');

    await cy(member, 'sidebar-transactions').click();
    await expect(member).toHaveURL(/\/login.*ended=1/);
    await expect(cy(member, 'login-session-ended')).toBeVisible();

    await loginAs(member, MEMBER_EMAIL, MEMBER_PASSWORD);
    await expect(cy(member, 'login-error')).toHaveText('E-mail ou senha incorretos.');
    await expect(member).toHaveURL(/\/login/);

    await cy(page, `user-enable-${memberUserId}`).click();
    await expect(cy(page, `user-status-${memberUserId}`)).toHaveText('Ativo');

    await loginAs(member, MEMBER_EMAIL, MEMBER_PASSWORD);
    await expect(member).toHaveURL(/\/transactions$/);
    void api;
    await context.close();
  });

  test('Dado dois usuários no mesmo aparelho, Quando um sai e o outro entra, Então nada do anterior aparece nem fica no armazenamento do navegador', async ({
    page,
    playwright,
    baseURL,
    net,
  }) => {
    net.allow(401, 403);
    const request = await playwright.request.newContext({ baseURL });
    const ownMemberApi = new Api(request, sink);
    await ownMemberApi.login(MEMBER_EMAIL, MEMBER_PASSWORD);
    await ownMemberApi.createAccount({ name: MEMBER_ACCOUNT, openingBalance: '7.00' });
    await request.dispose();

    await page.goto('/login');
    await loginAs(page, MEMBER_EMAIL, MEMBER_PASSWORD);
    await expect(page).toHaveURL(/\/$/);
    await open(page, '/accounts');
    await expect(page.locator('body')).toContainText(MEMBER_ACCOUNT);
    await expect(page.locator('body')).not.toContainText(OWNER_ACCOUNT);

    await cy(page, 'sidebar-signOut').click();
    await expect(cy(page, 'login-page')).toBeVisible();
    const afterMember = await browserStorageDump(page);
    expect(afterMember).not.toContain(MEMBER_ACCOUNT);
    expect(afterMember).not.toContain(MEMBER_EMAIL);

    await loginAs(
      page,
      process.env['E2E_OWNER_EMAIL'] ?? '',
      process.env['E2E_OWNER_PASSWORD'] ?? '',
    );
    await expect(page).toHaveURL(/\/$/);
    await open(page, '/accounts');
    await expect(page.locator('body')).toContainText(OWNER_ACCOUNT);
    await expect(page.locator('body')).not.toContainText(MEMBER_ACCOUNT);

    await cy(page, 'sidebar-signOut').click();
    await expect(cy(page, 'login-page')).toBeVisible();
    const afterOwner = await browserStorageDump(page);
    expect(afterOwner).not.toContain(OWNER_ACCOUNT);
    expect(afterOwner).not.toContain(process.env['E2E_OWNER_EMAIL'] ?? 'x@x');
  });
});

async function waitReady(page: Page): Promise<void> {
  await expect(cy(page, 'page-title')).toBeVisible();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Locator, Page, Request } from '@playwright/test';

import { expect, Lang, seedPreferences, test as base, waitForApp } from '../support';
import { Api, FailureSink, resetDatabase } from '../support/api';
import { ContractFailure, validateRequest, validateResponse } from '../support/contract';
import { fmt } from '../support/format';
import { expiredAccessToken, subjectOf } from '../support/jwt';

export { expect, fmt, resetDatabase, seedPreferences, waitForApp };
export type { Lang };

export const EVIDENCE_DIR = resolve(
  __dirname,
  '..',
  '..',
  '..',
  'docs',
  'qa',
  'evidencias',
  'etapa-2',
);

export interface SeenCall {
  method: string;
  url: URL;
  status: number | null;
  startedAt: number;
  endedAt: number;
  authorization: boolean;
  requestBody: unknown;
  responseBody: unknown;
  hasBody: boolean;
  bodyRead: boolean;
  bodyError?: string;
  headers?: Record<string, string>;
  expiredTokenSent?: boolean;
  idempotencyKey?: string;
  dropped?: boolean;
}

export class NetLog {
  readonly calls: SeenCall[] = [];
  readonly failures: ContractFailure[] = [];
  readonly leakedAuthorization: string[] = [];
  private readonly pending: Promise<void>[] = [];
  private allowed = new Set<number>();
  checkDuplicates = true;
  allowAnonymousBoot = true;
  offline = false;
  private expireNext = 0;
  private expireSubject = '';
  private drops: { match: RegExp; method: string; left: number }[] = [];
  private faults: { match: RegExp; method: string; status: number; left: number }[] = [];
  duplicateOk: string[] = [];

  constructor(page: Page, origin: string, intercept = true) {
    page.on('request', (req: Request) => {
      const url = new URL(req.url());
      const auth = req.headers()['authorization'];
      if (auth && !(url.origin === origin && url.pathname.startsWith('/v1'))) {
        this.leakedAuthorization.push(req.url());
      }
      if (auth && url.pathname.startsWith('/v1/auth/')) {
        this.leakedAuthorization.push(`${req.url()} (Authorization em /v1/auth/*)`);
      }
    });
    if (!intercept) {
      page.on('response', (res) => {
        const url = new URL(res.url());
        if (url.origin !== origin || !url.pathname.startsWith('/v1')) return;
        this.calls.push({
          method: res.request().method(),
          url,
          status: res.status(),
          startedAt: Date.now(),
          endedAt: Date.now(),
          authorization: !!res.request().headers()['authorization'],
          requestBody: null,
          responseBody: null,
          hasBody: false,
          bodyRead: false,
        });
      });
    } else
      void page.route(
        (url) => url.origin === origin && url.pathname.startsWith('/v1'),
        async (route) => {
          const req = route.request();
          const url = new URL(req.url());
          if (this.offline) {
            await route.abort('internetdisconnected');
            return;
          }
          const call: SeenCall = {
            method: req.method(),
            url,
            status: null,
            startedAt: Date.now(),
            endedAt: 0,
            authorization: !!req.headers()['authorization'],
            idempotencyKey: req.headers()['idempotency-key'],
            requestBody: null,
            responseBody: null,
            hasBody: false,
            bodyRead: false,
          };
          try {
            call.requestBody = req.postDataJSON();
          } catch {
            call.requestBody = null;
          }
          this.calls.push(call);
          const fault = this.faults.find(
            (f) => f.left > 0 && f.method === req.method() && f.match.test(url.pathname),
          );
          if (fault) {
            fault.left--;
            call.status = fault.status;
            call.endedAt = Date.now();
            call.bodyRead = true;
            call.hasBody = true;
            call.responseBody = {
              type: 'urn:moneylog:problem:INTERNAL_ERROR',
              title: 'Internal Server Error',
              status: fault.status,
              code: 'INTERNAL_ERROR',
              detail: 'Erro interno.',
              instance: url.pathname,
              traceId: '00000000000000000000000000000000',
            };
            await route.fulfill({
              status: fault.status,
              contentType: 'application/problem+json',
              body: JSON.stringify(call.responseBody),
            });
            return;
          }
          const headers = { ...req.headers() };
          if (
            this.expireNext > 0 &&
            headers['authorization'] &&
            !url.pathname.startsWith('/v1/auth/')
          ) {
            this.expireNext--;
            headers['authorization'] = `Bearer ${expiredAccessToken(this.expireSubject)}`;
            call.expiredTokenSent = true;
          }
          try {
            const response = await route.fetch({ headers });
            const buffer = await response.body();
            call.status = response.status();
            call.headers = response.headers();
            call.endedAt = Date.now();
            call.bodyRead = true;
            const text = buffer.toString('utf8');
            call.hasBody = text.length > 0;
            try {
              call.responseBody = text ? JSON.parse(text) : null;
            } catch {
              call.responseBody = text;
            }
            const drop = this.drops.find(
              (d) => d.left > 0 && d.method === req.method() && d.match.test(url.pathname),
            );
            if (drop) {
              drop.left--;
              call.dropped = true;
              await route.abort('connectionreset');
              return;
            }
            await route.fulfill({ response });
          } catch (error) {
            call.bodyError = String(error);
            call.endedAt = Date.now();
            await route.abort().catch(() => undefined);
          }
        },
      );
  }

  forceExpiredToken(accessToken: string, count = 1): void {
    this.expireSubject = subjectOf(accessToken);
    this.expireNext = count;
  }

  dropNextResponse(method: string, match: RegExp, times = 1): void {
    this.drops.push({ method, match, left: times });
  }

  failNext(method: string, match: RegExp, status = 500, times = 1): void {
    this.faults.push({ method, match, status, left: times });
  }

  allow(...statuses: number[]): void {
    for (const s of statuses) this.allowed.add(s);
  }

  find(method: string, path: string | RegExp): SeenCall[] {
    return this.calls.filter(
      (c) =>
        c.method === method &&
        (typeof path === 'string' ? c.url.pathname === path : path.test(c.url.pathname)),
    );
  }

  async body<T = any>(
    method: string,
    path: string | RegExp,
    which: 'first' | 'last' = 'last',
  ): Promise<T> {
    await expect
      .poll(
        async () => {
          await this.settle();
          return this.find(method, path).filter((c) => c.bodyRead).length;
        },
        { message: `resposta de ${method} ${String(path)}`, timeout: 8000 },
      )
      .toBeGreaterThan(0);
    const found = this.find(method, path).filter((c) => c.bodyRead);
    const call = which === 'first' ? found[0] : found[found.length - 1];
    if (!call) throw new Error(`nenhuma resposta de ${method} ${String(path)} capturada`);
    if (!call.bodyRead)
      throw new Error(`corpo de ${method} ${String(path)} indisponível: ${call.bodyError}`);
    return call.responseBody as T;
  }

  async settle(): Promise<void> {
    await Promise.all(this.pending);
  }

  async verify(): Promise<string[]> {
    await this.settle();
    const problems: string[] = [];
    for (const c of this.calls) {
      if (c.status === null) continue;
      const path = c.url.pathname;
      if (c.bodyRead)
        for (const f of validateResponse(c.method, path, c.status, c.responseBody, c.hasBody)) {
          problems.push(`contrato: ${f.where}: ${f.detail}`);
        }
      if (c.requestBody !== null && c.bodyRead) {
        for (const f of validateRequest(c.method, path, c.requestBody)) {
          problems.push(`contrato: ${f.where}: ${f.detail}`);
        }
      }
      const bootRefresh =
        c.method === 'POST' &&
        path === '/v1/auth/refresh' &&
        c.status === 401 &&
        this.allowAnonymousBoot;
      if (c.status >= 400 && !this.allowed.has(c.status) && !bootRefresh) {
        problems.push(`status inesperado: ${c.method} ${path} -> ${c.status}`);
      }
    }
    for (const leak of this.leakedAuthorization) problems.push(`Authorization vazou para ${leak}`);
    if (this.checkDuplicates) {
      const seen = new Map<string, number>();
      for (const c of [...this.calls].sort((a, b) => a.startedAt - b.startedAt)) {
        if (c.method !== 'GET') continue;
        if (this.duplicateOk.some((p) => c.url.pathname.startsWith(p))) continue;
        const key = c.url.pathname + c.url.search;
        const last = seen.get(key);
        if (last !== undefined && c.startedAt < last) {
          problems.push(`requisição duplicada: GET ${key} (a anterior ainda estava em voo)`);
        }
        seen.set(key, c.endedAt);
      }
    }
    return problems;
  }
}

interface Fixtures {
  interceptApi: boolean;
  api: Api;
  net: NetLog;
  signIn: (page?: Page) => Promise<Api>;
  evidence: (page: Page, name: string) => Promise<void>;
}

export const test = base.extend<Fixtures>({
  interceptApi: [true, { option: true }],
  api: async ({ playwright, baseURL }, use) => {
    const request = await playwright.request.newContext({ baseURL });
    const sink: FailureSink = [];
    const api = new Api(request, sink);
    await api.login();
    await use(api);
    await request.dispose();
    expect(
      sink.map((f) => `${f.where}: ${f.detail}`),
      'contrato das chamadas de apoio',
    ).toEqual([]);
  },
  net: [
    async ({ page, baseURL, interceptApi }, use) => {
      const net = new NetLog(page, new URL(baseURL ?? 'http://localhost').origin, interceptApi);
      await use(net);
      expect(await net.verify(), 'rede: contrato, status, Authorization e duplicadas').toEqual([]);
    },
    { auto: true },
  ],
  signIn: async ({ page, baseURL }, use) => {
    await use(async (target = page) => {
      const sink: FailureSink = [];
      const api = new Api(target.context().request, sink);
      await api.login();
      expect(sink).toEqual([]);
      void baseURL;
      return api;
    });
  },
  evidence: async ({}, use, testInfo) => {
    await use(async (page, name) => {
      if (!process.env['E2E_EVIDENCE']) return;
      const dir = testInfo.file.endsWith('cards.e2e.ts')
        ? EVIDENCE_DIR.replace(/etapa-2$/, 'etapa-3')
        : EVIDENCE_DIR;
      mkdirSync(dir, { recursive: true });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: resolve(dir, `${name}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    });
  },
});

export const norm = (s: string): string =>
  s
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export async function cyText(page: Page, cy: string): Promise<string> {
  const el = page.locator(`[data-cy="${cy}"]`).first();
  await expect(el).toBeVisible();
  return norm(await el.innerText());
}

export async function totalsText(page: Page, part: string): Promise<string> {
  const el = page
    .locator(`[data-cy="totals-footer-${part}"], [data-cy="totals-summary-${part}"]`)
    .filter({ visible: true })
    .first();
  await expect(el).toBeVisible();
  return norm(await el.innerText());
}

export const cy = (page: Page, id: string): Locator => page.locator(`[data-cy="${id}"]`);

export async function fillAmount(page: Page, amount: string): Promise<void> {
  const input = cy(page, 'entry-amount');
  await input.fill(amount);
  await input.blur();
}

export async function pick(page: Page, fieldId: string, label: string): Promise<void> {
  await cy(page, fieldId).click();
  await cy(page, `${fieldId}-listbox`).getByRole('option', { name: label, exact: true }).click();
}

export async function pickValue(page: Page, fieldId: string, value: string): Promise<void> {
  await cy(page, fieldId).click();
  await cy(page, `${fieldId}-option-${value}`).click();
}

export async function openFilters(page: Page): Promise<void> {
  const toggle = cy(page, 'filters-toggle');
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
}

export async function loginViaUi(page: Page): Promise<void> {
  await cy(page, 'login-email').fill(process.env['E2E_OWNER_EMAIL'] ?? '');
  await cy(page, 'login-password').fill(process.env['E2E_OWNER_PASSWORD'] ?? '');
  await cy(page, 'login-submit').click();
}

export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForApp(page);
}

export type { Api };

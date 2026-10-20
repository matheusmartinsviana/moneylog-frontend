import { expect, Page, test as base } from '@playwright/test';

export const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;
export type ViewportName = keyof typeof VIEWPORTS;

export const CANVAS = {
  light: 'rgb(241, 242, 234)',
  dark: 'rgb(11, 29, 21)',
} as const;

export type Lang = 'pt' | 'en' | 'es';

export const HTML_LANG: Record<Lang, string> = { pt: 'pt-BR', en: 'en', es: 'es' };

export const NAV_LABELS: Record<Lang, Record<string, string>> = {
  pt: {
    home: 'Início',
    transactions: 'Movimentações',
    quickAdd: 'Novo registro',
    goals: 'Metas',
    more: 'Mais',
    cards: 'Cartões',
    accounts: 'Contas',
    planning: 'Planejamento',
    statement: 'Resumo do mês',
    simulator: 'Posso comprar?',
    people: 'Pessoas',
    notes: 'Notas',
    import: 'Importar extrato',
    insights: 'Insights',
    settings: 'Configurações',
    budgets: 'Orçamentos',
    vault: 'Vault',
    ai: 'IA',
    mcp: 'MCP',
    notifications: 'Notificações',
  },
  en: {
    home: 'Home',
    transactions: 'Transactions',
    quickAdd: 'New entry',
    goals: 'Goals',
    more: 'More',
    cards: 'Cards',
    accounts: 'Accounts',
    planning: 'Planning',
    statement: 'Month statement',
    simulator: 'Purchase check',
    people: 'People',
    notes: 'Notes',
    import: 'Import statement',
    insights: 'Insights',
    settings: 'Settings',
    budgets: 'Budgets',
    vault: 'Vault',
    ai: 'AI',
    mcp: 'MCP',
    notifications: 'Notifications',
  },
  es: {
    home: 'Inicio',
    transactions: 'Movimientos',
    quickAdd: 'Nuevo registro',
    goals: 'Metas',
    more: 'Más',
    cards: 'Tarjetas',
    accounts: 'Cuentas',
    planning: 'Planificación',
    statement: 'Resumen del mes',
    simulator: '¿Puedo comprar?',
    people: 'Personas',
    notes: 'Notas',
    import: 'Importar extracto',
    insights: 'Insights',
    settings: 'Ajustes',
    budgets: 'Presupuestos',
    vault: 'Vault',
    ai: 'IA',
    mcp: 'MCP',
    notifications: 'Notificaciones',
  },
};

export const NOT_FOUND_TITLE: Record<Lang, string> = {
  pt: 'Página não encontrada',
  en: 'Page not found',
  es: 'Página no encontrada',
};

export const ROUTES = [
  { path: '/', key: 'home' },
  { path: '/transactions', key: 'transactions' },
  { path: '/goals', key: 'goals' },
  { path: '/more', key: 'more' },
  { path: '/cards', key: 'cards' },
  { path: '/accounts', key: 'accounts' },
  { path: '/planning', key: 'planning' },
  { path: '/statement', key: 'statement' },
  { path: '/simulator', key: 'simulator' },
  { path: '/people', key: 'people' },
  { path: '/notes', key: 'notes' },
  { path: '/import', key: 'import' },
  { path: '/insights', key: 'insights' },
  { path: '/settings', key: 'settings' },
  { path: '/budgets', key: 'budgets' },
  { path: '/vault', key: 'vault' },
  { path: '/ai', key: 'ai' },
  { path: '/mcp', key: 'mcp' },
  { path: '/notifications', key: 'notifications' },
] as const;

export const BOTTOM_NAV_ORDER = ['home', 'transactions', 'budgets', 'goals', 'settings'];
export const BOTTOM_NAV_SHORT_LABELS: Record<Lang, Record<string, string>> = {
  pt: { settings: 'Ajustes' },
  en: {},
  es: { transactions: 'Movimientos', budgets: 'Presup.' },
};
export const BOTTOM_NAV_LABELS: Record<Lang, Record<string, string>> = {
  pt: {
    home: 'Visão geral',
    transactions: 'Transações',
    budgets: 'Orçamentos',
    goals: 'Metas',
    settings: 'Configurações',
  },
  en: {
    home: 'Overview',
    transactions: 'Transactions',
    budgets: 'Budgets',
    goals: 'Goals',
    settings: 'Settings',
  },
  es: {
    home: 'Resumen',
    transactions: 'Transacciones',
    budgets: 'Presupuestos',
    goals: 'Metas',
    settings: 'Ajustes',
  },
};
export const SIDEBAR_GROUP_ORDER = {
  overview: [
    'home',
    'transactions',
    'accounts',
    'cards',
    'goals',
    'budgets',
    'planning',
    'statement',
    'simulator',
  ],
  workspace: ['vault', 'notes', 'people', 'insights', 'ai', 'mcp'],
  system: ['import', 'notifications', 'settings'],
} as const;
export const SIDEBAR_ORDER: string[] = Object.values(SIDEBAR_GROUP_ORDER).flat();
export const RAIL_ORDER: string[] = [...SIDEBAR_GROUP_ORDER.overview, 'settings'];
export const MORE_ORDER = SIDEBAR_ORDER.filter((key) => !BOTTOM_NAV_ORDER.includes(key));

const RAW_KEY =
  /\b(shell|nav|header|charts|dashboard|search|emptyState|settings|home|more|notFound|quickAdd|money|goals|summary|projections|exports|notes)\.[a-zA-Z]+(\.[a-zA-Z]+)*\b/;

interface Observed {
  consoleProblems: string[];
  thirdPartyRequests: string[];
  apiRequests: string[];
  failedRequests: string[];
}

export const test = base.extend<{ observed: Observed }>({
  observed: [
    async ({ page, baseURL }, use, testInfo) => {
      const origin = new URL(baseURL ?? 'http://localhost').origin;
      const observed: Observed = {
        consoleProblems: [],
        thirdPartyRequests: [],
        apiRequests: [],
        failedRequests: [],
      };
      const integration = testInfo.project.name === 'integration' || testInfo.project.name === 'api-stub';
      page.on('console', (msg) => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          if (
            integration &&
            /Failed to load resource: (the server responded with a status of [45]\d\d|net::ERR_(CONNECTION_RESET|INTERNET_DISCONNECTED))/.test(
              msg.text(),
            )
          ) {
            return;
          }
          observed.consoleProblems.push(`[${msg.type()}] ${msg.text()}`);
        }
      });
      page.on('pageerror', (err) => observed.consoleProblems.push(`[pageerror] ${err.message}`));
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (url.protocol === 'data:' || url.protocol === 'blob:') return;
        if (url.origin !== origin) observed.thirdPartyRequests.push(req.url());
        if (url.origin === origin && url.pathname.startsWith('/v1')) {
          observed.apiRequests.push(req.url());
        }
      });
      page.on('requestfailed', (req) => {
        const reason = req.failure()?.errorText ?? '';
        if (reason.includes('ERR_ABORTED')) return;
        if (integration && /ERR_CONNECTION_RESET|ERR_INTERNET_DISCONNECTED/.test(reason)) return;
        observed.failedRequests.push(`${req.url()} (${reason})`);
      });

      await use(observed);

      expect.soft(observed.consoleProblems, 'console sem erros nem warnings').toEqual([]);
      expect.soft(observed.thirdPartyRequests, 'nenhuma requisição a terceiros').toEqual([]);
      if (!integration) {
        expect.soft(observed.apiRequests, 'nenhuma chamada a /v1 em modo mock').toEqual([]);
      }
      expect.soft(observed.failedRequests, 'nenhuma requisição com falha').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export async function seedMockResponses(
  page: Page,
  responses: Record<string, unknown>,
): Promise<void> {
  await page.addInitScript((value) => {
    (globalThis as Record<string, unknown>)['__MONEYLOG_MOCK_RESPONSES__'] = value;
  }, responses);
}

export async function waitForApp(page: Page): Promise<void> {
  await expect(page.locator('[data-cy="page-title"]')).toBeVisible();
}

export async function seedPreferences(
  page: Page,
  prefs: { language?: Lang; theme?: 'light' | 'dark' },
): Promise<void> {
  await page.addInitScript((p) => {
    try {
      if (p.language) localStorage.setItem('moneylog.language', p.language);
      if (p.theme) localStorage.setItem('moneylog.theme', p.theme);
    } catch {}
  }, prefs);
}

export async function openSettingsMore(page: Page): Promise<void> {
  await page.goto('/settings');
  await waitForApp(page);
  const toggle = page.locator('[data-cy="settings-more-toggle"]');
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
}

export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, 'sem scroll horizontal').toBeLessThanOrEqual(clientWidth);
}

export async function expectNoRawKeys(page: Page): Promise<void> {
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(RAW_KEY);
}

export async function bodyBackground(page: Page): Promise<string> {
  return page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return getComputedStyle(document.body).backgroundColor;
  });
}

const AXE_PATH = require.resolve('axe-core/axe.min.js');

export interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  targets: string[];
}

export async function runAxe(page: Page): Promise<AxeViolation[]> {
  await page.addScriptTag({ path: AXE_PATH });
  return page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (ctx: Document) => Promise<AxeResult> } }).axe;
    interface AxeResult {
      violations: {
        id: string;
        impact: string | null;
        help: string;
        nodes: { target: string[] }[];
      }[];
    }
    const result = await axe.run(document);
    return result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      targets: v.nodes.map((n) => n.target.join(' ')),
    }));
  });
}

export const HOSTILE_MARKDOWN: Record<string, { build: (size: number) => string; heavy: boolean }> =
  {
    'asteriscos soltos (*a *a ...)': {
      build: (n) => '*a '.repeat(Math.ceil(n / 3)).slice(0, n),
      heavy: true,
    },
    'negrito e itálico abertos (**a *b ...)': {
      build: (n) => '**a *b '.repeat(Math.ceil(n / 7)).slice(0, n),
      heavy: true,
    },
    'tachado aberto (~~a ...)': {
      build: (n) => '~~a '.repeat(Math.ceil(n / 4)).slice(0, n),
      heavy: true,
    },
    'sublinhados (_a_a...)': {
      build: (n) => '_a'.repeat(Math.ceil(n / 2)).slice(0, n),
      heavy: true,
    },
    'sinais de menor (<<<...)': { build: (n) => '<'.repeat(n), heavy: true },
    'links abertos ([a]( ...)': {
      build: (n) => '[a]('.repeat(Math.ceil(n / 4)).slice(0, n),
      heavy: false,
    },
    'tags abertas (<a <a ...)': {
      build: (n) => '<a '.repeat(Math.ceil(n / 3)).slice(0, n),
      heavy: true,
    },
    'tarefas (- [ ] a ...)': {
      build: (n) => '- [ ] a\n'.repeat(Math.ceil(n / 8)).slice(0, n),
      heavy: true,
    },
    'citações aninhadas (> > > ...)': {
      build: (n) => '> '.repeat(Math.ceil(n / 2)).slice(0, n),
      heavy: false,
    },
  };

export async function openSeededNote(page: Page, body: string): Promise<string> {
  const id = crypto.randomUUID();
  await page.goto('/notes');
  await waitForApp(page);
  await page.evaluate(
    ({ id: noteId, text }) => {
      const now = '2026-10-05T10:00:00Z';
      sessionStorage.setItem(
        `moneylog.mock.note.${noteId}`,
        JSON.stringify({
          id: noteId,
          path: 'hostil/nota.md',
          title: 'nota',
          body: text,
          tags: [],
          links: [],
          version: 1,
          trashedAt: null,
          createdAt: now,
          updatedAt: now,
        }),
      );
      const w = window as unknown as { __maxStall: number };
      w.__maxStall = 0;
      let last = performance.now();
      setInterval(() => {
        const t = performance.now();
        w.__maxStall = Math.max(w.__maxStall, t - last - 50);
        last = t;
      }, 50);
      history.pushState({}, '', `/notes/${noteId}`);
      dispatchEvent(new PopStateEvent('popstate'));
    },
    { id, text: body },
  );
  return id;
}

export async function maxMainThreadStallMs(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as { __maxStall: number }).__maxStall);
}

export async function expectSidebarReachable(page: Page): Promise<void> {
  const keys = await page
    .locator('[data-cy="sidebar"] a, [data-cy="sidebar"] button')
    .evaluateAll((els) => els.map((el) => el.getAttribute('data-cy') ?? ''));
  expect(keys, 'marca, novo registro, 9 itens, Mais, Configurações e Sair').toHaveLength(14);
  const viewport = page.viewportSize()!;
  const signOut = (await page.locator('[data-cy="sidebar-signOut"]').boundingBox())!;
  expect(signOut.y, 'o Sair já está à vista, sem rolar').toBeGreaterThanOrEqual(0);
  expect(signOut.y + signOut.height, 'o Sair não passa do fim da janela').toBeLessThanOrEqual(
    viewport.height + 0.5,
  );
  for (const key of keys) {
    const item = page.locator(`[data-cy="${key}"]`);
    await item.scrollIntoViewIfNeeded();
    const state = await item.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        inView: rect.top >= 0 && rect.bottom <= window.innerHeight + 0.5,
        clickable: top !== null && (node === top || node.contains(top)),
      };
    });
    expect(state, `${key} alcançável em ${viewport.width}x${viewport.height}`).toEqual({
      inView: true,
      clickable: true,
    });
  }
}

export async function focusRingClippedSides(
  page: Page,
  selector: string,
  ring = 4,
): Promise<string[]> {
  return page
    .locator(selector)
    .first()
    .evaluate((node, size) => {
      const rect = node.getBoundingClientRect();
      const clipped = new Set<string>();
      for (let el = node.parentElement; el; el = el.parentElement) {
        const style = getComputedStyle(el);
        const clipsX = style.overflowX !== 'visible';
        const clipsY = style.overflowY !== 'visible';
        if (!clipsX && !clipsY) continue;
        const box = el.getBoundingClientRect();
        const left = box.left + el.clientLeft;
        const top = box.top + el.clientTop;
        if (clipsX && rect.left - size < left - 0.5) clipped.add('left');
        if (clipsX && rect.right + size > left + el.clientWidth + 0.5) clipped.add('right');
        if (clipsY && rect.top - size < top - 0.5) clipped.add('top');
        if (clipsY && rect.bottom + size > top + el.clientHeight + 0.5) clipped.add('bottom');
      }
      return [...clipped];
    }, ring);
}

export function contrastRatio(a: string, b: string): number {
  const channels = (css: string) => (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  const luminance = (css: string) => {
    const [r, g, bl] = channels(css).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

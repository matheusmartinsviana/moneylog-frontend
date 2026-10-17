import type { Page } from '@playwright/test';

import { expect, seedMockResponses, seedPreferences, test, waitForApp } from './support';
import { homeResponses, upcoming } from './support/home-fixtures';

const SCREENS = [
  { name: '1200x800', width: 1200, height: 800, rolaPagina: false },
  { name: '1280x720', width: 1280, height: 720, rolaPagina: false },
  { name: '1440x900', width: 1440, height: 900, rolaPagina: false },
  { name: '768x1024', width: 768, height: 1024, rolaPagina: true },
  { name: '1024x768', width: 1024, height: 768, rolaPagina: true },
  { name: '1199x800', width: 1199, height: 800, rolaPagina: true },
  { name: '390x844', width: 390, height: 844, rolaPagina: true },
] as const;
const THEMES = ['light', 'dark'] as const;

const UPCOMING_THREE = {
  ...upcoming,
  items: [
    ['Aluguel', '2026-10-11', '1800.00', 'TOMORROW'],
    ['Internet', '2026-10-12', '119.90', 'NEXT_7_DAYS'],
    ['Streaming', '2026-10-14', '39.90', 'NEXT_7_DAYS'],
  ].map(([label, dueDate, amount, bucket]) => ({
    kind: 'RECURRENCE',
    bucket,
    dueDate,
    direction: 'OUT',
    amount: { amount, currency: 'BRL' },
    label,
    refType: 'RECURRENCE',
    refId: null,
    items: [],
  })),
};

async function measure(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const content = document.querySelector('main') ?? document.body;
    const scrollsX = (el: Element): boolean => {
      const overflow = getComputedStyle(el).overflowX;
      if (el.clientWidth <= 1) return false;
      if (el.matches('.np__count, .lc__tick') || el.querySelector('.np__count')) return false;
      return el.scrollWidth > el.clientWidth + 4 && overflow !== 'auto' && overflow !== 'scroll';
    };
    return {
      pageHeight: doc.scrollHeight,
      innerHeight: window.innerHeight,
      pageWidth: doc.scrollWidth,
      innerWidth: window.innerWidth,
      horizontal: [content, ...content.querySelectorAll('*')]
        .filter(scrollsX)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className)}`.slice(0, 80)),
    };
  });
}

for (const screen of SCREENS) {
  for (const theme of THEMES) {
    test(`Dado ${screen.name} no tema ${theme} em português, quando abro o Início, então ${screen.rolaPagina ? 'não rola na horizontal' : 'a página não rola e o conteúdo rola dentro dos painéis, sem cortes'}`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: screen.width, height: screen.height });
      await seedPreferences(page, { language: 'pt', theme });
      if (testInfo.project.name !== 'demo') {
        await seedMockResponses(page, {
          ...homeResponses(),
          '/v1/dashboard/upcoming': UPCOMING_THREE,
        });
      }
      await page.goto('/');
      await waitForApp(page);
      await expect(page.locator('[data-cy="home-dashboard"]')).toBeVisible();
      await expect(page.locator('[data-cy="home-chart-panel"]')).toBeVisible();
      await page.waitForTimeout(600);

      const m = await measure(page);
      if (!screen.rolaPagina) {
        expect(m.pageHeight, 'a página não rola na vertical').toBeLessThanOrEqual(m.innerHeight);
      }
      expect(m.pageWidth, 'a página não rola na horizontal').toBeLessThanOrEqual(m.innerWidth);
      expect(m.horizontal, 'nenhum elemento com corte ou rolagem horizontal').toEqual([]);
      if (!screen.rolaPagina) {
        const hidden = await page.evaluate(() => {
          const grid = document
            .querySelector('[data-cy="home-dashboard"]')!
            .getBoundingClientRect();
          return [...document.querySelectorAll('[data-cy^="home-col-"]')]
            .map((col) => col.getBoundingClientRect())
            .filter((rect) => rect.bottom > grid.bottom + 8 || rect.top < grid.top - 8).length;
        });
        expect(hidden, 'as colunas ficam dentro do painel e rolam por dentro').toBe(0);
      }
    });
  }
}

const OTHER_SCREENS = [
  '/transactions',
  '/accounts',
  '/cards',
  '/goals',
  '/planning/overview',
  '/planning/recurrences',
  '/planning/occurrences',
  '/planning/summary',
  '/planning/projections',
  '/planning/debts',
  '/planning/third-parties',
  '/planning/commitments',
  '/people',
  '/notes',
  '/vault',
  '/ai',
  '/mcp',
  '/settings',
  '/import',
  '/notifications',
  '/budgets',
  '/insights',
  '/cards/00000003-0000-4000-8000-000000000001',
  '/cards/00000003-0000-4000-8000-000000000001/invoices/00000004-0000-4000-8000-000000000014',
  '/goals/00000008-0000-4000-8000-000000000001',
  '/people/00000006-0000-4000-8000-000000000001',
  '/planning/commitments/00000010-0000-4000-8000-000000000001',
] as const;

for (const route of OTHER_SCREENS) {
  test(`Dado 1280x720 em português, quando abro ${route}, então a página não rola`, async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'demo', 'usa os dados sintéticos do modo demo');
    await page.setViewportSize({ width: 1280, height: 720 });
    await seedPreferences(page, { language: 'pt', theme: 'dark' });
    await page.goto(route);
    await waitForApp(page);
    await page.waitForTimeout(2500);

    const m = await measure(page);
    expect(m.pageHeight, 'a página não rola na vertical').toBeLessThanOrEqual(m.innerHeight);
    expect(m.pageWidth, 'a página não rola na horizontal').toBeLessThanOrEqual(m.innerWidth);
    expect(m.horizontal, 'nenhum elemento com corte ou rolagem horizontal').toEqual([]);
  });
}

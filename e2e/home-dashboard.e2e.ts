import type { Page } from '@playwright/test';

import {
  expect,
  expectNoHorizontalScroll,
  expectNoRawKeys,
  runAxe,
  seedMockResponses,
  seedPreferences,
  test,
  VIEWPORTS,
  waitForApp,
} from './support';
import {
  CATEGORY_FOOD,
  CONSUMPTION,
  NOTE_ID,
  homeResponses,
  incomeExpensesD7,
  incomeExpensesM3,
  spendingByCategory,
} from './support/home-fixtures';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmt = (amount: string): string =>
  brl
    .format(amount as unknown as number)
    .replace(/\u00a0/g, ' ')
    .replace('-', '−');

const norm = (value: string | null): string =>
  (value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function openHome(page: Page, responses = homeResponses()): Promise<void> {
  await seedPreferences(page, { language: 'pt' });
  await seedMockResponses(page, responses);
  await page.goto('/');
  await waitForApp(page);
  await expect(page.locator('[data-cy="home-dashboard"]')).toBeVisible();
  await expect(page.locator('[data-cy="home-chart-totals"]')).toBeVisible();
}

test.describe('Início sucinto: valores = JSON do contrato (desktop 1280)', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('saldo disponível, receitas, despesas e resultado do mês mostram o que o JSON diz', async ({
    page,
  }) => {
    await openHome(page);

    await expect(page.locator('[data-cy="home-wallet-label"]')).toHaveText('Disponível');
    await expect(page.locator('[data-cy="home-wallet-available"]')).toContainText(fmt('17617.00'));
    await expect(page.locator('[data-cy="home-analytics-income"]')).toContainText(fmt('12000.00'));
    await expect(page.locator('[data-cy="home-analytics-expenses"]')).toContainText(
      fmt(CONSUMPTION),
    );
    await expect(page.locator('[data-cy="home-analytics-net"]')).toContainText(fmt('10379.50'));
  });

  test('carteira e análise ficam lado a lado e o gráfico ocupa a linha de baixo, sem sobreposição', async ({
    page,
  }) => {
    for (const width of [1200, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await openHome(page);

      const boxes = await page.evaluate(() =>
        ['home-wallet-header', 'home-analytics', 'home-chart-panel'].map((id) => {
          const rect = document.querySelector(`[data-cy="${id}"]`)!.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        }),
      );
      const [wallet, analytics, chart] = boxes as [
        (typeof boxes)[number],
        (typeof boxes)[number],
        (typeof boxes)[number],
      ];
      expect(wallet.right, `${width}: carteira antes da análise`).toBeLessThanOrEqual(
        analytics.left,
      );
      expect(Math.abs(wallet.top - analytics.top), `${width}: mesma linha`).toBeLessThan(30);
      expect(chart.top, `${width}: gráfico abaixo da carteira`).toBeGreaterThanOrEqual(
        wallet.bottom,
      );
      expect(chart.top, `${width}: gráfico abaixo da análise`).toBeGreaterThanOrEqual(
        analytics.bottom,
      );
      await expectNoHorizontalScroll(page);
    }
  });

  test('os cartões flutuantes (insight, meta) não cobrem texto nem controle: nenhum interativo se sobrepõe', async ({
    page,
  }) => {
    await openHome(page);

    const overlaps = await page.evaluate(() => {
      const items = [
        ...document.querySelectorAll<HTMLElement>(
          '[data-cy="home-dashboard"] a, [data-cy="home-dashboard"] button',
        ),
      ]
        .map((el) => ({ el, rect: el.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 && rect.height > 0);
      const found: string[] = [];
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i]!.rect;
          const b = items[j]!.rect;
          const inter =
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
          if (inter && !items[i]!.el.contains(items[j]!.el) && !items[j]!.el.contains(items[i]!.el))
            found.push(`${items[i]!.el.dataset['cy']} x ${items[j]!.el.dataset['cy']}`);
        }
      }
      return found;
    });
    expect(overlaps).toEqual([]);
  });

  test('há uma h1 e cada painel tem a sua h2', async ({ page }) => {
    await openHome(page);

    await expect(page.locator('main h1')).toHaveCount(1);
    for (const id of ['home-wallet-header', 'home-analytics', 'home-chart-panel']) {
      await expect(page.locator(`[data-cy="${id}"] h2`).first(), id).toHaveCount(1);
    }
  });

  test('a atividade recente vem do JSON e abre o detalhe', async ({ page }) => {
    await openHome(page);

    await expect(page.locator('[data-cy="home-recent-item"]').first()).toBeVisible();
    await page.locator('[data-cy="home-recent-link"]').first().click();
    await expect(page).toHaveURL(/\/transactions\/[0-9a-f-]+/);
  });

  test('os blocos que saíram do Início continuam acessíveis nas telas deles, com os mesmos números', async ({
    page,
  }) => {
    await openHome(page);
    for (const id of [
      'home-accounts-section',
      'home-categories-total',
      'home-legacy',
      'home-quick-capture',
      'home-budget',
    ]) {
      await expect(page.locator(`[data-cy="${id}"]`), id).toHaveCount(0);
    }

    await page.goto('/accounts');
    await expect(
      page.locator('[data-cy="page-content"]').getByText(fmt('12345.67')).first(),
    ).toBeVisible();

    await page.goto('/planning/overview');
    const overview = page.locator('[data-cy="home-legacy"]');
    for (const id of ['home-available', 'home-commitments']) {
      await expect(overview.locator(`[data-cy="${id}"]`), id).toBeVisible();
    }
    await page.locator('[data-cy="overview-more-toggle"]').click();
    await expect(overview.locator('[data-cy="home-month-income"]')).toBeVisible();
    await expect(page.locator('[data-cy="planning-tab-overview"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('o gasto por categoria (que saiu do Início) está no Resumo do mês, com valor e % do backend e link filtrado', async ({
    page,
  }) => {
    await openHome(page);
    await page.goto('/planning/summary/2026-10');
    await expect(page.locator('[data-cy="home-categories-total"]')).toContainText(
      fmt(spendingByCategory.total.amount),
    );
    expect(spendingByCategory.total.amount).toBe(CONSUMPTION);

    const food = page.locator(`[data-cy="home-categories-item-${CATEGORY_FOOD}"]`);
    expect(norm(await food.textContent())).toContain(fmt('820.00'));
    expect(norm(await food.textContent())).toContain('50,6%');
    expect(
      norm(await page.locator('[data-cy="home-categories-item-other"]').textContent()),
    ).toContain('Outras (3 categorias)');

    await page.locator(`[data-cy="home-categories-link-${CATEGORY_FOOD}"]`).click();
    await expect(page).toHaveURL(
      new RegExp(`/transactions\\?view=entries&categoryId=${CATEGORY_FOOD}`),
    );
  });

  test('o gráfico oferece os períodos do contrato e a tabela equivalente repete o JSON, inclusive o negativo', async ({
    page,
  }) => {
    const withRefund = { ...incomeExpensesD7, period: 'D30' as const };
    await openHome(page, {
      ...homeResponses(),
      '/v1/reports/income-expenses?period=D30': withRefund,
    });
    const rows = page.locator('[data-cy="home-chart-table"] tbody tr');

    await expect(page.locator('[data-cy="home-chart-period-D30"]')).toHaveAttribute(
      'aria-checked',
      'true',
    );

    await page.locator('[data-cy="home-chart-table-toggle"]').click();
    await expect(rows).toHaveCount(withRefund.points.length);
    const refund = withRefund.points[5]!;
    expect(norm(await rows.nth(5).textContent())).toContain(fmt(refund.expenses.amount));
    expect(fmt(refund.expenses.amount)).toBe('−R$ 50,00');
    for (const [i, point] of withRefund.points.entries()) {
      const text = norm(await rows.nth(i).textContent());
      expect(text).toContain(fmt(point.income.amount));
      expect(text).toContain(fmt(point.expenses.amount));
    }

    await page.locator('[data-cy="home-chart-period-M3"]').click();
    await expect(rows).toHaveCount(incomeExpensesM3.points.length);
    await expect(page.locator('[data-cy="home-chart-period-D7"]')).toHaveCount(0);
    await expect(page.locator('[data-cy="home-chart-period-M12"]')).toHaveCount(0);
  });

  test('troca de período pelo teclado (setas do controle segmentado)', async ({ page }) => {
    await openHome(page);

    await page.locator('[data-cy="home-chart-period-D30"]').focus();
    await page.keyboard.press('ArrowRight');

    await expect(page.locator('[data-cy="home-chart-period-M3"]')).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  test('"+ Registrar" abre o Novo registro e o menu abre o "Emprestei"', async ({ page }) => {
    await openHome(page);

    await expect(page.locator('[data-cy="home-register-open"]')).toHaveClass(/button--primary/);

    await page.locator('[data-cy="home-register-menu"]').click();
    await page.locator('[data-cy="home-register-menu-item-loan"]').click();
    await expect(page).toHaveURL(/mode=loan/);
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');

    await page.locator('[data-cy="home-register-open"]').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('o orçamento está na página /budgets "em breve" e ela é um item essencial da sidebar', async ({
    page,
  }) => {
    await openHome(page);

    await page.goto('/budgets');

    await expect(page.locator('[data-cy="page-title"]')).toHaveText('Orçamentos');
    await expect(page.locator('[data-cy="empty-state-title"]')).toHaveText(
      'Orçamentos chegam em breve.',
    );
    await expect(page.locator('[data-cy="sidebar-budgets"]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('o tema escuro e o claro não têm violações de acessibilidade no Início', async ({
    page,
  }) => {
    for (const theme of ['light', 'dark'] as const) {
      await seedPreferences(page, { language: 'pt', theme });
      await seedMockResponses(page, homeResponses());
      await page.emulateMedia({ colorScheme: theme });
      await page.goto('/');
      await waitForApp(page);
      await expect(page.locator('[data-cy="home-chart-totals"]')).toBeVisible();
      await expectNoRawKeys(page);
      expect(await runAxe(page), `axe ${theme}`).toEqual([]);
    }
  });
});

test.describe('Início: mês em andamento (R5)', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('com partial = true, o painel analítico continua mostrando o mês do servidor', async ({
    page,
  }) => {
    await openHome(page, homeResponses({ partial: true }));

    await expect(page.locator('[data-cy="home-analytics-month"]')).toBeVisible();
  });
});

test.describe('busca global (T209)', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('"/" foca a busca, o painel agrupa, o snippet é texto puro e as setas + Enter abrem', async ({
    page,
  }) => {
    await openHome(page);

    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('/');
    const field = page.locator('[data-cy="global-search-input"]');
    await expect(field).toBeFocused();
    await expect(field).toHaveAttribute('role', 'combobox');
    await expect(field).toHaveAttribute('type', 'text');

    await page.keyboard.type('mercado');
    const results = page.locator('[data-cy="global-search-results"]');
    await expect(results).toBeVisible();
    await expect(results.getByText('Movimentações')).toBeVisible();
    await expect(results.getByText('Notas')).toBeVisible();
    await expect(page.locator('[data-cy="global-search-option-transactions"]')).toContainText(
      fmt('87.30'),
    );
    await expect(page.locator('[data-cy="global-search-snippet"]')).toHaveText(
      '<b>Comprar</b> leite **e** pão <img src=x onerror=alert(1)>',
    );
    expect(await results.locator('b, img, strong').count()).toBe(0);

    await page.keyboard.press('ArrowDown');
    await expect(field).toHaveAttribute(
      'aria-activedescendant',
      (await page.locator('[data-cy="global-search-option-transactions"]').getAttribute('id'))!,
    );
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/notes/${NOTE_ID}$`));
  });

  test('Esc fecha o painel e mantém o foco no campo; digitar "/" dentro de outro campo não dispara a busca', async ({
    page,
  }) => {
    await openHome(page);
    const field = page.locator('[data-cy="global-search-input"]');

    await field.click();
    await page.keyboard.type('mercado');
    await expect(page.locator('[data-cy="global-search-results"]')).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(page.locator('[data-cy="global-search-results"]')).toHaveCount(0);
    await expect(field).toBeFocused();
    await expect(field).toHaveAttribute('aria-expanded', 'false');

    await page.keyboard.type('a/b');
    await expect(field).toHaveValue('mercadoa/b');
  });

  test('menos de 2 caracteres não chama a API e mostra a dica', async ({ page }) => {
    await openHome(page);

    await page.locator('[data-cy="global-search-input"]').click();
    await page.keyboard.type('m');

    await expect(page.locator('[data-cy="global-search-hint"]')).toHaveText(
      'Digite ao menos 2 caracteres.',
    );
  });
});

test.describe('Início em 375 px (mobile)', () => {
  test.use({ viewport: VIEWPORTS.mobile });

  test('sem rolagem horizontal e uma coluna na ordem carteira, análise e gráfico', async ({
    page,
  }) => {
    await openHome(page);
    await expectNoHorizontalScroll(page);

    const tops = await page.evaluate(() =>
      ['home-wallet-header', 'home-analytics', 'home-chart-panel'].map(
        (id) => document.querySelector(`[data-cy="${id}"]`)?.getBoundingClientRect().top ?? -1,
      ),
    );
    for (let i = 1; i < tops.length; i++)
      expect(tops[i]!, `bloco ${i}`).toBeGreaterThan(tops[i - 1]!);
  });

  test('a busca é um botão de lupa que abre uma folha e devolve o foco ao fechar', async ({
    page,
  }) => {
    await openHome(page);

    const open = page.locator('[data-cy="global-search-open"]');
    await expect(open).toBeVisible();
    await expect(page.locator('[data-cy="global-search-input"]')).toHaveCount(0);
    await open.click();
    const field = page.locator('[data-cy="global-search-input"]');
    await expect(field).toBeFocused();
    await page.keyboard.type('mercado');
    await expect(page.locator('[data-cy="global-search-results"]')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect(open).toBeFocused();
    await expectNoHorizontalScroll(page);
  });

  test('escuro: sem rolagem horizontal nem violações no 375', async ({ page }) => {
    await seedPreferences(page, { language: 'pt', theme: 'dark' });
    await seedMockResponses(page, homeResponses());
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await waitForApp(page);
    await expect(page.locator('[data-cy="home-chart-totals"]')).toBeVisible();
    await expectNoHorizontalScroll(page);
    expect(await runAxe(page)).toEqual([]);
  });
});

test.describe('Início em tablet (768 a 1199 px)', () => {
  for (const width of [768, 1024, 1199]) {
    test(`${width} px: ${width < 1024 ? 'uma coluna' : 'carteira e análise lado a lado'}, sem sobreposição`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1024 });
      await openHome(page);
      await expectNoHorizontalScroll(page);
      await expect(page.locator('[data-cy="global-search-input"]')).toBeVisible();
      const boxes = await page.evaluate(() =>
        ['home-wallet-header', 'home-analytics', 'home-chart-panel'].map((id) => {
          const rect = document.querySelector(`[data-cy="${id}"]`)!.getBoundingClientRect();
          return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
        }),
      );
      const [wallet, analytics, chart] = boxes as [
        (typeof boxes)[number],
        (typeof boxes)[number],
        (typeof boxes)[number],
      ];
      if (width < 1024) {
        expect(analytics.top).toBeGreaterThanOrEqual(wallet.bottom - 1);
      } else {
        expect(wallet.right).toBeLessThanOrEqual(analytics.left);
      }
      expect(chart.top).toBeGreaterThanOrEqual(Math.min(wallet.bottom, analytics.bottom) - 1);
      await expect(page.locator('[data-cy="home-chart-totals"]')).toBeVisible();
      await expect(page.locator('[data-cy="home-recent-link"]').first()).toBeVisible();
    });
  }
});

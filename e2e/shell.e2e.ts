import {
  BOTTOM_NAV_LABELS,
  BOTTOM_NAV_ORDER,
  BOTTOM_NAV_SHORT_LABELS,
  expect,
  expectNoHorizontalScroll,
  expectNoRawKeys,
  HTML_LANG,
  Lang,
  MORE_ORDER,
  NAV_LABELS,
  NOT_FOUND_TITLE,
  ROUTES,
  RAIL_ORDER,
  seedPreferences,
  test,
  VIEWPORTS,
  ViewportName,
  waitForApp,
} from './support';

test.describe('shell em 375 × 812 (mobile)', () => {
  test.use({ viewport: VIEWPORTS.mobile });

  test('barra inferior fixa com Visão geral · Transações · Orçamentos · Metas · Configurações e sem sidebar', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForApp(page);

    const bottomNav = page.locator('[data-cy="bottom-nav"]');
    await expect(bottomNav).toBeVisible();
    await expect(page.locator('[data-cy="sidebar"]')).toBeHidden();

    const keys = await bottomNav
      .locator('a[data-cy^="bottom-nav-"]')
      .evaluateAll((links) =>
        links.map((a) => a.getAttribute('data-cy')!.replace('bottom-nav-', '')),
      );
    expect(keys).toEqual(BOTTOM_NAV_ORDER);

    for (const key of BOTTOM_NAV_ORDER) {
      await expect(page.locator(`[data-cy="bottom-nav-${key}"]`)).toHaveAccessibleName(
        BOTTOM_NAV_SHORT_LABELS.pt[key] ?? BOTTOM_NAV_LABELS.pt[key]!,
      );
    }

    const box = await bottomNav.boundingBox();
    expect(box).not.toBeNull();
    const gap = VIEWPORTS.mobile.height - Math.round(box!.y + box!.height);
    expect(gap, 'a barra flutua a poucos pixels da borda inferior').toBeGreaterThanOrEqual(0);
    expect(gap).toBeLessThanOrEqual(16);
    const position = await bottomNav.evaluate(
      (el) => getComputedStyle(el.closest('app-bottom-nav') ?? el).position,
    );
    expect(position).toBe('fixed');

    const style = await bottomNav.evaluate((el) => {
      const computed = getComputedStyle(el);
      return { filter: computed.backdropFilter };
    });
    expect(style.filter === 'none' || style.filter === '').toBe(true);
    await expect(page.locator('[data-cy="bottom-nav-quickAdd"]')).toHaveCount(0);
    await expect(page.locator('[data-cy="bottom-nav-more"]')).toHaveCount(0);
    await expectNoHorizontalScroll(page);
  });

  test('a navegação pela barra inferior não recarrega a página e marca aria-current', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.evaluate(() => ((window as unknown as { __spa: number }).__spa = 1));

    for (const key of BOTTOM_NAV_ORDER) {
      const link = page.locator(`[data-cy="bottom-nav-${key}"]`);
      await link.click();
      await expect(link).toHaveAttribute('aria-current', 'page');
      await expect(
        page.locator('[data-cy="bottom-nav"] [aria-current="page"]:visible'),
      ).toHaveCount(1);
      await expect(page.locator('[data-cy="page-title"]')).toHaveText(NAV_LABELS.pt[key]!);
      await expectNoHorizontalScroll(page);
    }
    expect(await page.evaluate(() => (window as unknown as { __spa?: number }).__spa)).toBe(1);
  });

  test('/more continua acessível pelo botão de menu do cabeçalho a partir do Início em 375 px', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForApp(page);
    await page.locator('[data-cy="header-menu"]').click();
    await expect(page).toHaveURL(/\/more$/);
    await expect(page.locator('[data-cy="more-list"]')).toBeVisible();
  });

  test('/more lista as seções que não estão na barra inferior e cada uma abre', async ({
    page,
  }) => {
    await page.goto('/more');
    await waitForApp(page);
    const keys = await page
      .locator('[data-cy="more-list"] a[data-cy^="more-"]')
      .evaluateAll((links) => links.map((a) => a.getAttribute('data-cy')!.replace('more-', '')));
    expect(keys).toEqual(MORE_ORDER);

    for (const key of MORE_ORDER) {
      await page.goto('/more');
      await page.locator(`[data-cy="more-${key}"]`).click();
      await expect(page.locator('[data-cy="page-title"]')).toHaveText(NAV_LABELS.pt[key]!);
      await expectNoHorizontalScroll(page);
    }
  });

  test('Tab percorre a barra inferior na ordem, com foco visível, e Enter navega', async ({
    page,
  }) => {
    await page.goto('/goals');
    await waitForApp(page);

    const reached: string[] = [];
    for (let i = 0; i < 30 && reached.length < BOTTOM_NAV_ORDER.length; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return null;
        const style = getComputedStyle(el);
        return {
          cy: el.getAttribute('data-cy'),
          focusVisible: el.matches(':focus-visible'),
          ring: style.boxShadow,
          outline: style.outlineStyle,
        };
      });
      if (info?.cy?.startsWith('bottom-nav-')) {
        expect(info.focusVisible, `${info.cy} com :focus-visible`).toBe(true);
        expect(info.ring, `${info.cy} com anel de foco`).toMatch(/0px 0px 0px 4px/);
        reached.push(info.cy.replace('bottom-nav-', ''));
      }
    }
    expect(reached).toEqual(BOTTOM_NAV_ORDER);

    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('[data-cy="bottom-nav-transactions"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/transactions$/);
  });

  test('link "Pular para o conteúdo" aparece no foco e leva o foco ao <main>', async ({ page }) => {
    await page.goto('/cards');
    await waitForApp(page);
    await page.keyboard.press('Tab');
    const skip = page.locator('[data-cy="skip-to-content"]');
    await expect(skip).toBeFocused();
    await expect
      .poll(() => skip.evaluate((el) => el.getBoundingClientRect().top))
      .toBeGreaterThanOrEqual(0);
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main-content')).toBeFocused();
    await expect(page).toHaveURL(/\/cards$/);
  });
});

test.describe('shell em 768 × 1024 (tablet)', () => {
  test.use({ viewport: VIEWPORTS.tablet });

  test('trilho recolhido com rótulo acessível e sem barra inferior', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    await expect(page.locator('[data-cy="bottom-nav"]')).toBeHidden();
    const sidebar = page.locator('[data-cy="sidebar"]');
    await expect(sidebar).toBeVisible();

    const width = (await sidebar.boundingBox())!.width;
    expect(width, 'sidebar recolhida (só ícones)').toBeLessThan(100);

    for (const key of RAIL_ORDER) {
      const link = page.locator(`[data-cy="sidebar-${key}"]`);
      await expect(link).toBeVisible();
      await expect(link).toHaveAccessibleName(NAV_LABELS.pt[key]!);
    }
    await expect(page.locator('[data-cy="sidebar-more"]')).toBeVisible();
    await expect(page.locator('[data-cy="sidebar-signOut"]')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('Tab alcança a sidebar com foco visível e o rótulo aparece como tooltip', async ({
    page,
  }) => {
    await page.goto('/more');
    await waitForApp(page);
    const reached: string[] = [];
    for (let i = 0; i < 40 && reached.length < RAIL_ORDER.length; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const square = el.querySelector('.sidebar__sq');
        return {
          cy: el.getAttribute('data-cy'),
          ring: square ? getComputedStyle(square).boxShadow : 'none',
        };
      });
      const key = info.cy?.replace('sidebar-', '') ?? '';
      if (RAIL_ORDER.includes(key)) {
        reached.push(key);
        expect(info.ring, `${info.cy} com anel de foco`).toMatch(/0px 0px 0px 4px/);
        await expect(
          page.locator('body > .tooltip[role="tooltip"]'),
          `${info.cy} mostra o rótulo no foco`,
        ).toHaveText(NAV_LABELS.pt[key]!);
      }
    }
    expect(reached).toEqual(RAIL_ORDER);
  });
});

test.describe('shell em 1280 × 800 (desktop)', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('trilho de 64 px com os 9 itens essenciais na ordem, Mais e Configurações, sem Dream Board', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForApp(page);
    await expect(page.locator('[data-cy="bottom-nav"]')).toBeHidden();
    const sidebar = page.locator('[data-cy="sidebar"]');
    await expect(sidebar).toBeVisible();
    expect((await sidebar.boundingBox())!.width, 'trilho recolhido').toBeLessThan(100);

    const keys = await sidebar
      .locator('li a[data-cy^="sidebar-"], a[data-cy="sidebar-settings"]')
      .evaluateAll((links) => links.map((a) => a.getAttribute('data-cy')!.replace('sidebar-', '')));
    expect(keys).toEqual(RAIL_ORDER);
    for (const key of RAIL_ORDER) {
      await expect(page.locator(`[data-cy="sidebar-${key}"]`)).toHaveAccessibleName(
        NAV_LABELS.pt[key]!,
      );
    }
    await expect(sidebar).not.toContainText(/dream/i);
    await expectNoHorizontalScroll(page);
  });

  test('o item ativo do trilho continua com foco visível', async ({ page }) => {
    await page.goto('/transactions');
    await waitForApp(page);
    const active = page.locator('[data-cy="sidebar-transactions"]');
    await expect(active).toHaveAttribute('aria-current', 'page');
    await page.locator('[data-cy="sidebar-home"]').focus();
    await page.keyboard.press('Tab');
    await expect(active).toBeFocused();
    const ring = await active.evaluate((el) => ({
      focusVisible: el.matches(':focus-visible'),
      boxShadow: getComputedStyle(el.querySelector('.sidebar__sq')!).boxShadow,
    }));
    expect(ring.focusVisible).toBe(true);
    expect(ring.boxShadow, 'anel de foco no item ativo').toMatch(/0px 0px 0px 4px/);
  });

  test('o "Novo registro" recebe foco visível pelo teclado', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);
    const quickAdd = page.locator('[data-cy="sidebar-quickAdd"]');
    await page.locator('[data-cy="sidebar-brand"]').focus();
    await page.keyboard.press('Tab');
    await expect(quickAdd).toBeFocused();
    const boxShadow = await quickAdd.evaluate(
      (el) => getComputedStyle(el.querySelector('.sidebar__sq')!).boxShadow,
    );
    expect(boxShadow, 'anel de foco no "Novo registro"').toMatch(/0px 0px 0px 4px/);
  });
});

const NO_EMPTY_STATE = new Set(['more', 'import', 'vault', 'mcp', 'statement', 'settings', 'ai']);

for (const viewport of Object.keys(VIEWPORTS) as ViewportName[]) {
  test.describe(`todas as rotas em ${viewport}`, () => {
    test.use({ viewport: VIEWPORTS[viewport] });

    for (const lang of ['pt', 'en', 'es'] as Lang[]) {
      test(`idioma ${lang}: títulos, estado vazio, sem chave crua e sem scroll horizontal`, async ({
        page,
      }) => {
        await seedPreferences(page, { language: lang });
        for (const route of ROUTES) {
          await page.goto(route.path);
          await waitForApp(page);
          await expect(page.locator('html')).toHaveAttribute('lang', HTML_LANG[lang]);
          await expect(page.locator('h1')).toHaveCount(1);
          await expect(page.locator('main')).toHaveCount(1);
          await expect(page.locator('[data-cy="page-title"]')).toHaveText(
            NAV_LABELS[lang][route.key]!,
          );
          if (!NO_EMPTY_STATE.has(route.key)) {
            await expect(page.locator('[data-cy="empty-state"]').first()).toBeVisible();
          }
          await expectNoRawKeys(page);
          await expectNoHorizontalScroll(page);
        }

        await page.goto('/rota-que-nao-existe');
        await expect(page.locator('[data-cy="page-title"]')).toHaveText(NOT_FOUND_TITLE[lang]);
        await expectNoRawKeys(page);
        await page.locator('[data-cy="empty-state-action-go-home"]').click();
        await expect(page.locator('[data-cy="page-title"]')).toHaveText(NAV_LABELS[lang]['home']!);
      });
    }
  });
}

test.describe('troca de idioma pelas Configurações', () => {
  test.use({ viewport: VIEWPORTS.desktop });

  test('troca para en e es, atualiza <html lang> e persiste no reload', async ({ page }) => {
    await page.goto('/settings');
    await waitForApp(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

    await page.locator('[data-cy="settings-language"]').click();
    await page.locator('[data-cy="settings-language-option-en"]').click();
    await expect(page.locator('[data-cy="page-title"]')).toHaveText('Settings');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('[data-cy="sidebar-home"]')).toHaveAccessibleName('Home');

    await page.locator('[data-cy="settings-language"]').click();
    await page.locator('[data-cy="settings-language-option-es"]').click();
    await expect(page.locator('[data-cy="page-title"]')).toHaveText('Ajustes');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    await page.reload();
    await expect(page.locator('[data-cy="page-title"]')).toHaveText('Ajustes');
    await expectNoRawKeys(page);
  });

  test('o idioma do navegador não muda o padrão pt-BR', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ locale: 'en-US', baseURL });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('[data-cy="page-title"]')).toHaveText('Início');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await context.close();
  });
});

import type { Page } from '@playwright/test';

import { expect, ROUTES, seedPreferences, test, VIEWPORTS, waitForApp } from './support';

declare global {
  interface Window {
    __native: string[];
    __nativeScan: () => string[];
  }
}

async function installDetector(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const found: string[] = [];
    const BANNED_TAGS = ['select', 'datalist', 'details', 'summary', 'dialog', 'progress', 'meter'];
    const ALLOWED_TYPES = ['text', 'email', 'password', 'search'];
    const BANNED_ATTRS = [
      'popover',
      'popovertarget',
      'popovertargetaction',
      'contenteditable',
      'title',
    ];
    const describe = (el: Element): string =>
      `<${el.localName}${el.getAttribute('type') ? ` type=${el.getAttribute('type')}` : ''}${
        el.getAttribute('data-cy') ? ` data-cy=${el.getAttribute('data-cy')}` : ''
      }>`;
    const inSvg = (el: Element): boolean => el.namespaceURI === 'http://www.w3.org/2000/svg';
    const check = (el: Element): string[] => {
      const problems: string[] = [];
      if (inSvg(el)) return problems;
      if (BANNED_TAGS.includes(el.localName)) problems.push(`tag nativa ${describe(el)}`);
      if (el.localName === 'input') {
        const type = (el.getAttribute('type') ?? 'text').trim().toLowerCase();
        const pickerInput =
          type === 'file' &&
          (!el.isConnected ||
            ((el.closest('app-file-picker') !== null || el.closest('app-files-button') !== null) &&
              el.hasAttribute('hidden')));
        if (!ALLOWED_TYPES.includes(type) && !pickerInput) {
          problems.push(`input nativo ${describe(el)}`);
        }
      }
      for (const attr of BANNED_ATTRS) {
        if (el.hasAttribute(attr)) problems.push(`atributo ${attr} em ${describe(el)}`);
      }
      return problems;
    };
    const checkTree = (root: Element): void => {
      found.push(...check(root));
      for (const child of Array.from(root.querySelectorAll('*'))) found.push(...check(child));
    };
    window.__native = found;
    window.__nativeScan = () => {
      const all: string[] = [...found];
      for (const el of Array.from(document.querySelectorAll('*'))) all.push(...check(el));
      return Array.from(new Set(all));
    };

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === 'attributes' && record.target instanceof Element) {
          found.push(...check(record.target));
        }
        for (const node of Array.from(record.addedNodes)) {
          if (node instanceof Element) checkTree(node);
        }
      }
    });
    observer.observe(document, { subtree: true, childList: true, attributes: true });

    const setAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name: string, value: string) {
      setAttribute.call(this, name, value);
      found.push(...check(this));
    };
    const typeDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'type');
    if (typeDescriptor?.set) {
      Object.defineProperty(HTMLInputElement.prototype, 'type', {
        ...typeDescriptor,
        set(this: HTMLInputElement, value: string) {
          typeDescriptor.set?.call(this, value);
          found.push(...check(this));
        },
      });
    }
    for (const name of ['alert', 'confirm', 'prompt'] as const) {
      window[name] = ((): never | undefined => {
        found.push(`window.${name}()`);
        return undefined;
      }) as never;
    }
    const proto = HTMLInputElement.prototype as unknown as { showPicker?: () => void };
    if (proto.showPicker) {
      proto.showPicker = () => {
        found.push('input.showPicker()');
      };
    }
    for (const method of ['showModal', 'show'] as const) {
      const dialog = HTMLDialogElement.prototype;
      dialog[method] = () => {
        found.push(`dialog.${method}()`);
      };
    }
  });
}

async function exerciseGateComponents(page: Page): Promise<void> {
  for (const open of [
    'open-dialog-basic',
    'open-dialog-alert',
    'open-dialog-long',
    'open-sheet',
    'open-sheet-side',
    'open-dialog',
    'open-dialog-risk',
  ]) {
    await page
      .locator(`[data-cy="light-${open}"]`)
      .click({ timeout: 2_000 })
      .catch(() => undefined);
    await page.waitForTimeout(120);
    await page.keyboard.press('Escape');
    await page
      .locator('[data-cy="light-dialog-alert-discard"]')
      .click({ timeout: 300 })
      .catch(() => undefined);
    await page.waitForTimeout(60);
  }
  for (const menu of ['light-menu-default', 'light-menu-full']) {
    await page
      .locator(`[data-cy="${menu}"]`)
      .click({ timeout: 2_000 })
      .catch(() => undefined);
    await page.waitForTimeout(120);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
  }
  const stepper = page.locator('[data-cy="light-stepper-default"]');
  await stepper.focus({ timeout: 2_000 }).catch(() => undefined);
  await page.keyboard.press('ArrowUp').catch(() => undefined);
  await page
    .locator('[data-cy="light-tabs-default-tab-limit"]')
    .click({ timeout: 2_000 })
    .catch(() => undefined);
  await page
    .locator('[data-cy="light-radio-default-min"]')
    .click({ timeout: 2_000 })
    .catch(() => undefined);
  await page.waitForTimeout(60);
}

async function exercise(page: Page): Promise<void> {
  const triggers = page.locator(
    '[aria-haspopup]:visible, [role="combobox"]:visible, button[aria-expanded="false"]:visible',
  );
  const count = Math.min(await triggers.count(), 12);
  for (let i = 0; i < count; i++) {
    const trigger = triggers.nth(i);
    if (!(await trigger.isVisible().catch(() => false))) continue;
    await trigger.click({ timeout: 2_000, trial: false }).catch(() => undefined);
    await page.waitForTimeout(120);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(60);
  }
  const actions = page.locator(
    'button[data-cy*="archive"]:visible, button[data-cy*="void"]:visible',
  );
  const actionCount = Math.min(await actions.count(), 3);
  for (let i = 0; i < actionCount; i++) {
    await actions
      .nth(i)
      .click({ timeout: 2_000 })
      .catch(() => undefined);
    await page.waitForTimeout(120);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(60);
  }
}

const EXTRA_ROUTES = [
  '/dev/ui-kit',
  '/accounts/new',
  '/cards/new',
  '/quick-add?mode=credit',
  '/settings/categories',
  '/transactions?view=entries',
  '/people/new',
  '/quick-add?mode=loan',
  '/quick-add?mode=received',
  '/quick-add?mode=debt',
  '/planning/recurrences',
  '/planning/occurrences',
  '/planning/recurrences/new',
];

test.describe('guarda de runtime: nenhum controle nativo em nenhuma rota nem overlay', () => {
  for (const [name, viewport] of Object.entries({
    mobile: VIEWPORTS.mobile,
    desktop: VIEWPORTS.desktop,
  })) {
    for (const theme of ['light', 'dark'] as const) {
      test(`todas as rotas e overlays (${name}, ${theme})`, async ({ page }) => {
        test.setTimeout(180_000);
        await page.setViewportSize(viewport);
        await seedPreferences(page, { language: 'pt', theme });
        await installDetector(page);
        for (const path of [...ROUTES.map((r) => r.path), ...EXTRA_ROUTES]) {
          await page.goto(path);
          await waitForApp(page);
          await exercise(page);
          if (path === '/dev/ui-kit' && (await page.locator('[data-cy="ui-kit"]').count()) > 0) {
            await exerciseGateComponents(page);
          }
          const problems = await page.evaluate(() => window.__nativeScan());
          expect(problems, `controle nativo em ${path} (${name}, ${theme})`).toEqual([]);
        }
      });
    }
  }

  test('o detector enxerga um controle nativo criado em execução (teste do teste)', async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await installDetector(page);
    await page.goto('/settings');
    await waitForApp(page);
    const cases: Record<string, () => void> = {
      'innerHTML com select': () => {
        const host = document.createElement('div');
        host.innerHTML = '<select><option>a</option></select>';
        document.body.append(host);
      },
      'setAttribute type=date em input solto': () => {
        document.createElement('input').setAttribute('type', 'date');
      },
      'input.type = month em input solto': () => {
        document.createElement('input').type = 'month';
      },
      'atributo title': () => {
        const b = document.createElement('button');
        b.setAttribute('title', 'dica nativa');
        document.body.append(b);
      },
      'details inserido e removido logo depois': () => {
        const d = document.createElement('details');
        document.body.append(d);
        d.remove();
      },
      // eslint-disable-next-line no-restricted-properties
      'window.alert': () => window.alert('x'),
    };
    for (const [label, run] of Object.entries(cases)) {
      await page.evaluate(() => {
        window.__native.length = 0;
      });
      await page.evaluate(run);
      await page.waitForTimeout(30);
      const seen = await page.evaluate(() => window.__nativeScan());
      expect(seen.length, `o detector deveria acusar: ${label}`).toBeGreaterThan(0);
    }
  });
});

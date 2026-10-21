import { render, screen } from '@testing-library/angular';

import { pt } from '~/app/common/i18n/translations/pt';
import { ShortcutGuideComponent } from '~/app/features/settings/components/shortcut-guide/shortcut-guide.component';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';

async function setup(language: 'pt' | 'en' | 'es' = 'pt') {
  return render(ShortcutGuideComponent, { providers: [provideI18nTesting(language)] });
}

describe('ShortcutGuideComponent', () => {
  it('Dado o guia, então mostra os 7 passos na ordem e a informação de que o Toque nas Costas é do iPhone', async () => {
    await setup();

    const steps = screen.getByTestId('shortcut-guide-steps').querySelectorAll('li');
    expect(steps).toHaveLength(7);
    expect(steps[3]).toHaveTextContent(/Acessibilidade > Toque > Toque nas Costas/i);
    expect(steps[4]).toHaveTextContent(/Toque Duplo/i);
    expect(steps[6]).toHaveTextContent('revogue o token');
    expect(screen.getByTestId('shortcut-guide-iphone-only')).toHaveTextContent('só no iPhone');
  });

  it('Dado que não há link de Atalho compartilhado, então lista as ações para montar à mão sem link inventado', async () => {
    const { container } = await setup();

    expect(screen.getByTestId('shortcut-guide-no-link')).toHaveTextContent(
      /Ainda não há um Atalho pronto para importar/i,
    );
    const actions = screen.getByTestId('shortcut-guide-actions');
    expect(actions.querySelectorAll('li')).toHaveLength(6);
    expect(actions).toHaveTextContent(`${window.location.origin}/v1/quick-entries`);
    expect(actions).toHaveTextContent('yyyyMMddHHmmss');
    expect(actions).toHaveTextContent('de 8 a 64 caracteres');
    expect(actions).toHaveTextContent('Bearer seguido de um espaço');
    expect(actions).toHaveTextContent('EXPENSE ou INCOME, não o rótulo');
    expect(actions).toHaveTextContent('Idempotency-Key');
    expect(actions).toHaveTextContent('EXPENSE');
    expect(actions).toHaveTextContent('INCOME');
    expect(container.querySelector('a')).toBeNull();
  });

  it('Dado o guia, então avisa do risco com o iPhone bloqueado e de como revogar', async () => {
    await setup();

    expect(screen.getByTestId('shortcut-guide-risk')).toHaveTextContent(
      'roda com o iPhone bloqueado, sem Face ID',
    );
    expect(screen.getByTestId('shortcut-guide-risk')).toHaveTextContent(/Ajustes > Atalhos/i);
    expect(screen.getByTestId('shortcut-guide-risk')).toHaveTextContent('iCloud e no backup');
    expect(screen.getByTestId('shortcut-guide-step-6')).toHaveTextContent(
      'desbloqueado e depois bloqueado',
    );
  });

  it.each(['en', 'es'] as const)(
    'Dado o idioma %s, então o guia não usa o texto em português',
    async (language) => {
      await setup(language);

      const guide = screen.getByTestId('shortcut-guide');
      expect(guide).not.toHaveTextContent(pt.quickEntry.guide.stepsHeading);
      expect(screen.getByTestId('shortcut-guide-steps').querySelectorAll('li')).toHaveLength(7);
    },
  );

  it('Dado o guia, então não há violações de acessibilidade', async () => {
    const { container } = await setup();
    const violations = await axeViolations(container);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});

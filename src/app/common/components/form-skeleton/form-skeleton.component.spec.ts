import { render } from '@testing-library/angular';

import {
  FormSkeletonComponent,
  type FormSkeletonPiece,
} from '~/app/common/components/form-skeleton/form-skeleton.component';
import { axeViolations, describeViolations } from '~/testing/axe';

async function renderSkeleton(pieces: readonly FormSkeletonPiece[]) {
  const view = await render(FormSkeletonComponent, { inputs: { pieces } });
  return view.container.querySelector<HTMLElement>('[data-cy="form-skeleton"]')!;
}

describe('FormSkeletonComponent', () => {
  it('Dado as peças do formulário, então mostra um campo (rótulo + caixa) por peça e o rodapé de ações', async () => {
    const root = await renderSkeleton(['field', 'field-hint', 'field-date']);

    expect(root.querySelectorAll('.field')).toHaveLength(3);
    expect(root.querySelectorAll('.field__hint')).toHaveLength(1);
    expect(root.querySelectorAll('.skeleton-form__actions .button')).toHaveLength(2);
  });

  it('Dado "Mais opções" aberto, então mostra o cabeçalho e os campos de dentro', async () => {
    const root = await renderSkeleton(['field', { disclosure: ['field-hint', 'field-date'] }]);

    expect(root.querySelector('.skeleton-form__disclosure-head')).not.toBeNull();
    expect(root.querySelectorAll('.skeleton-form__more .field')).toHaveLength(2);
  });

  it('Dado um par de campos, então ficam lado a lado no mesmo bloco', async () => {
    const root = await renderSkeleton(['pair']);

    expect(root.querySelectorAll('.skeleton-form__pair .field')).toHaveLength(2);
  });

  it('Dado dicas e notas de duas linhas, então cada linha ganha o seu bloco', async () => {
    const root = await renderSkeleton(['field-hint-2', 'note-2', 'switch-2']);

    expect(root.querySelectorAll('.field__hint .sk')).toHaveLength(4);
    expect(root.querySelectorAll('.skeleton-form__note .sk')).toHaveLength(2);
  });

  it('Dado o esqueleto, então é decorativo (escondido de leitores de tela) e acessível', async () => {
    const root = await renderSkeleton(['field', 'field-hint', { disclosure: ['field'] }]);

    expect(root.getAttribute('aria-hidden')).toBe('true');
    const violations = await axeViolations(root);
    expect(violations, describeViolations(violations)).toEqual([]);
  });
});

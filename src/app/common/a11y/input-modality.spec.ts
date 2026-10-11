import { trackInputModality } from '~/app/common/a11y/input-modality';

describe('trackInputModality', () => {
  const root = document.documentElement;

  beforeAll(() => trackInputModality(document));
  afterEach(() => root.removeAttribute('data-input'));

  it('Dado um clique ou toque, então o foco é de ponteiro (sem anel)', () => {
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(root.getAttribute('data-input')).toBe('pointer');
  });

  it('Dado o toque em celular (touchstart/mousedown), então o foco é de ponteiro', () => {
    document.body.dispatchEvent(new Event('touchstart', { bubbles: true }));
    expect(root.getAttribute('data-input')).toBe('pointer');

    root.setAttribute('data-input', 'keyboard');
    document.body.dispatchEvent(new Event('mousedown', { bubbles: true }));
    expect(root.getAttribute('data-input')).toBe('pointer');
  });

  it('Dado Tab ou setas, então o foco é de teclado (com anel)', () => {
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(root.getAttribute('data-input')).toBe('keyboard');
  });

  it('Dado só uma tecla modificadora (Shift, Cmd), então a modalidade não muda', () => {
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta', bubbles: true }));

    expect(root.getAttribute('data-input')).toBe('pointer');
  });
});

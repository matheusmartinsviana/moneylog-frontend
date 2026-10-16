import { markOverlayOpen, OVERLAY_OPEN_CLASS } from './overlay-activity';

describe('markOverlayOpen', () => {
  it('Dado dois overlays abertos, quando fecho um, então o atributo continua até o último fechar', () => {
    const first = markOverlayOpen(document);
    const second = markOverlayOpen(document);
    expect(document.documentElement.classList.contains(OVERLAY_OPEN_CLASS)).toBe(true);
    first();
    expect(document.documentElement.classList.contains(OVERLAY_OPEN_CLASS)).toBe(true);
    second();
    expect(document.documentElement.classList.contains(OVERLAY_OPEN_CLASS)).toBe(false);
  });

  it('Dado um overlay aberto, quando libero duas vezes, então não desfaz a contagem de outro', () => {
    const first = markOverlayOpen(document);
    const second = markOverlayOpen(document);
    first();
    first();
    expect(document.documentElement.classList.contains(OVERLAY_OPEN_CLASS)).toBe(true);
    second();
    expect(document.documentElement.classList.contains(OVERLAY_OPEN_CLASS)).toBe(false);
  });
});

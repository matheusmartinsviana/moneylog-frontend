/**
 * Modalidade de entrada: `<html data-input="keyboard|pointer">`. O anel de foco é de quem navega pelo
 * teclado (Tab, setas); clicar ou tocar num botão mostra o efeito de pressionar, não a borda de acessibilidade.
 * O `:focus-visible` do navegador não basta: `focus()` por script (foco inicial do modal, devolução do foco ao
 * fechar, `<main tabindex="-1">`) acende o anel em vários navegadores mesmo depois de um clique.
 * O CSS (`base.css`) lê este atributo; campos de texto continuam com o anel (o foco neles é o próprio feedback).
 */
const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);

export function trackInputModality(doc: Document): void {
  const root = doc.documentElement;
  const set = (value: 'keyboard' | 'pointer') => {
    if (root.getAttribute('data-input') !== value) root.setAttribute('data-input', value);
  };
  doc.addEventListener(
    'keydown',
    (event) => {
      if (!MODIFIER_KEYS.has(event.key)) set('keyboard');
    },
    true,
  );
  for (const type of ['pointerdown', 'mousedown', 'touchstart']) {
    doc.addEventListener(type, () => set('pointer'), true);
  }
}

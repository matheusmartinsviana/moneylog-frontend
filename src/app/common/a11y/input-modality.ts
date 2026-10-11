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

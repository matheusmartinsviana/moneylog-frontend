const TEXT: Record<string, string> = {
  pt: 'Modo demonstração: as alterações não são salvas',
  en: 'Demo mode: changes are not saved',
  es: 'Modo demostración: los cambios no se guardan',
};

export function mountDemoBanner(): void {
  const doc = document;
  const banner = doc.createElement('div');
  banner.setAttribute('data-cy', 'demo-banner');
  banner.setAttribute('role', 'status');
  const apply = () => {
    const lang = (doc.documentElement.lang || 'pt').slice(0, 2);
    banner.textContent = TEXT[lang] ?? TEXT['pt']!;
  };
  apply();
  new MutationObserver(apply).observe(doc.documentElement, {
    attributes: true,
    attributeFilter: ['lang'],
  });
  Object.assign(banner.style, {
    padding: '3px 12px',
    background: 'var(--color-text)',
    color: 'var(--color-surface)',
    font: '500 12px/1.5 system-ui, sans-serif',
    textAlign: 'center',
  });
  doc.body.prepend(banner);
}

import {
  applyGlassMode,
  detectGlassMode,
  detectPanelGlassMode,
} from '~/app/common/services/glass-support';

const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1';
const SAFARI_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15';
const CHROME_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36';

interface Scenario {
  userAgent: string;
  backdropFilter?: boolean;
  backdropFilterUrl?: boolean;
  touch?: boolean;
  saveData?: boolean;
}

function documentFor(scenario: Scenario): Document {
  const { userAgent, backdropFilter = true, backdropFilterUrl = true, touch, saveData } = scenario;
  const root = document.createElement('html');
  const fakeDoc = {
    documentElement: root,
    createElement: () => {
      const style = { backdropFilter: '' };
      return {
        style: {
          set cssText(value: string) {
            if (!backdropFilter) style.backdropFilter = '';
            else if (value.includes('url('))
              style.backdropFilter = backdropFilterUrl ? 'url(#t)' : '';
            else style.backdropFilter = 'blur(1px)';
          },
          get backdropFilter() {
            return style.backdropFilter;
          },
        },
      };
    },
    defaultView: {
      navigator: { userAgent, connection: { saveData } },
      matchMedia: () => ({ matches: Boolean(touch) }),
    },
  };
  return fakeDoc as unknown as Document;
}

describe('Política de vidro do Início', () => {
  it('Dado Chromium desktop com suporte, Quando detecta, Então o painel usa blur e o vidro global refrata', () => {
    const doc = documentFor({ userAgent: CHROME_DESKTOP });
    expect(detectPanelGlassMode(doc)).toBe('blur');
    expect(detectGlassMode(doc)).toBe('refract');
  });

  it('Dado Safari no Mac, Quando detecta, Então o painel usa blur e o vidro global segue sólido', () => {
    const doc = documentFor({ userAgent: SAFARI_MAC });
    expect(detectPanelGlassMode(doc)).toBe('blur');
    expect(detectGlassMode(doc)).toBe('solid');
  });

  it('Dado Safari no iPhone com toque, Quando detecta, Então o painel usa blur', () => {
    const doc = documentFor({ userAgent: SAFARI_IPHONE, touch: true });
    expect(detectPanelGlassMode(doc)).toBe('blur');
    expect(detectGlassMode(doc)).toBe('solid');
  });

  it('Dado Chromium com toque, Quando detecta, Então o painel usa blur e o vidro global usa blur', () => {
    const doc = documentFor({ userAgent: CHROME_DESKTOP, touch: true });
    expect(detectPanelGlassMode(doc)).toBe('blur');
    expect(detectGlassMode(doc)).toBe('blur');
  });

  it('Dado navegador sem backdrop-filter, Quando detecta, Então o painel fica sólido', () => {
    const doc = documentFor({ userAgent: CHROME_DESKTOP, backdropFilter: false });
    expect(detectPanelGlassMode(doc)).toBe('solid');
  });

  it('Dado o recuo do Safari desligado, Quando detecta no iPhone e no Mac, Então o painel fica sólido', () => {
    expect(
      detectPanelGlassMode(documentFor({ userAgent: SAFARI_IPHONE, touch: true }), false),
    ).toBe('solid');
    expect(detectPanelGlassMode(documentFor({ userAgent: SAFARI_MAC }), false)).toBe('solid');
  });

  it('Dado o recuo do Safari desligado, Quando detecta no Chromium, Então o painel segue com blur', () => {
    expect(detectPanelGlassMode(documentFor({ userAgent: CHROME_DESKTOP }), false)).toBe('blur');
  });

  it('Dado modo economia de dados, Quando detecta, Então o painel fica sólido', () => {
    const doc = documentFor({ userAgent: CHROME_DESKTOP, saveData: true });
    expect(detectPanelGlassMode(doc)).toBe('solid');
  });

  it('Dado Safari com suporte, Quando aplica, Então marca data-glass-panel e não marca data-glass', () => {
    const doc = documentFor({ userAgent: SAFARI_IPHONE, touch: true });
    applyGlassMode(doc);
    expect(doc.documentElement.getAttribute('data-glass-panel')).toBe('blur');
    expect(doc.documentElement.hasAttribute('data-glass')).toBe(false);
  });

  it('Dado economia de dados, Quando aplica, Então remove data-glass-panel', () => {
    const doc = documentFor({ userAgent: CHROME_DESKTOP, saveData: true });
    doc.documentElement.setAttribute('data-glass-panel', 'blur');
    applyGlassMode(doc);
    expect(doc.documentElement.hasAttribute('data-glass-panel')).toBe(false);
  });
});

import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/angular';
import { configure as configureDom } from '@testing-library/dom';
import { afterEach } from 'vitest';

document.documentElement.setAttribute('data-motion', 'off');

configure({ dom: { testIdAttribute: 'data-cy' } });
configureDom({ testIdAttribute: 'data-cy' });

afterEach(() => {
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {}
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.lang = '';
});

import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/angular';
import { configure as configureDom } from '@testing-library/dom';
import { afterEach } from 'vitest';

document.documentElement.setAttribute('data-motion', 'off');

const ASYNC_UTIL_TIMEOUT_MS = 8_000;

configure({ dom: { testIdAttribute: 'data-cy', asyncUtilTimeout: ASYNC_UTIL_TIMEOUT_MS } });
configureDom({ testIdAttribute: 'data-cy', asyncUtilTimeout: ASYNC_UTIL_TIMEOUT_MS });

afterEach(() => {
  try {
    window.localStorage.clear();
    window.sessionStorage.clear();
  } catch {}
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.lang = '';
});

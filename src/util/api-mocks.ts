import { InjectionToken } from '@angular/core';

export const API_MOCKS = new InjectionToken<boolean>('API_MOCKS', {
  providedIn: 'root',
  factory: () => true,
});

const MOCK_RESPONSES_KEY = '__MONEYLOG_MOCK_RESPONSES__';

export function mockResponse<T>(key: string, fallback: T): T {
  const store = (globalThis as Record<string, unknown>)[MOCK_RESPONSES_KEY];
  if (typeof store !== 'object' || store === null) return fallback;
  const value = (store as Record<string, unknown>)[key];
  return value === undefined ? fallback : (value as T);
}

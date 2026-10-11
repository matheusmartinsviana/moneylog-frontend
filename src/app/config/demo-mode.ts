import type { EnvironmentProviders, Provider } from '@angular/core';

export function provideDemoMode(): (Provider | EnvironmentProviders)[] {
  return [];
}

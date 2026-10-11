import type { EnvironmentProviders, Provider } from '@angular/core';

import { provideDemoMode as provide } from '~/demo/demo-providers';

export function provideDemoMode(): (Provider | EnvironmentProviders)[] {
  return provide();
}

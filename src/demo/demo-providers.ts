import { HttpBackend } from '@angular/common/http';
import { EnvironmentProviders, Provider, provideAppInitializer } from '@angular/core';

import { DemoHttpBackend } from '~/demo/demo-backend';
import { mountDemoBanner } from '~/demo/demo-banner';

export function provideDemoMode(): (Provider | EnvironmentProviders)[] {
  return [
    { provide: HttpBackend, useClass: DemoHttpBackend },
    provideAppInitializer(() => mountDemoBanner()),
  ];
}

import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localePt from '@angular/common/locales/pt';
import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
} from '@angular/core';

import { I18nService } from '~/app/common/i18n/i18n.service';

export function registerMoneyLocales(): void {
  registerLocaleData(localePt, 'pt');
  registerLocaleData(localeEn, 'en');
}

export function provideI18n(): EnvironmentProviders {
  registerMoneyLocales();
  return makeEnvironmentProviders([provideAppInitializer(() => inject(I18nService).init())]);
}

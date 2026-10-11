import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, InjectionToken, signal } from '@angular/core';

import {
  AppI18n,
  DEFAULT_LANGUAGE,
  HTML_LANG,
  Language,
  SUPPORTED_LANGUAGES,
} from '~/app/common/i18n/i18n';
import { TRANSLATION_LOADERS } from '~/app/common/i18n/translation-loaders';
import { readStorage, writeStorage } from '~/util/safe-storage';

export const LANGUAGE_STORAGE_KEY = 'moneylog.language';

export interface I18nState {
  readonly language: Language;
  readonly translations: AppI18n;
}

export const INITIAL_I18N_STATE = new InjectionToken<I18nState | null>('INITIAL_I18N_STATE', {
  providedIn: 'root',
  factory: () => null,
});

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly loaders = inject(TRANSLATION_LOADERS);
  private readonly state = signal<I18nState | null>(inject(INITIAL_I18N_STATE));
  private requestId = 0;

  readonly ready = computed(() => this.state() !== null);
  readonly language = computed(() => this.current().language);
  readonly t = computed(() => this.current().translations);

  init(): Promise<void> {
    const stored = readStorage(LANGUAGE_STORAGE_KEY);
    return this.load(isLanguage(stored) ? stored : DEFAULT_LANGUAGE);
  }

  async use(language: Language): Promise<void> {
    await this.load(language);
    writeStorage(LANGUAGE_STORAGE_KEY, language);
  }

  private async load(language: Language): Promise<void> {
    const request = ++this.requestId;
    const translations = await this.loaders[language]();
    if (request !== this.requestId) return;
    this.state.set({ language, translations });
    this.document.documentElement.lang = HTML_LANG[language];
  }

  private current(): I18nState {
    const state = this.state();
    if (!state) throw new Error('I18nService usado antes de init().');
    return state;
  }
}

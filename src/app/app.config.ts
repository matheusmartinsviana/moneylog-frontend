import { DOCUMENT } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withPreloading,
  withViewTransitions,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from '~/app/app.routes';
import { trackInputModality } from '~/app/common/a11y/input-modality';
import { provideI18n } from '~/app/common/i18n/i18n.providers';
import { authInterceptor } from '~/app/common/interceptors/auth.interceptor';
import { unauthorizedInterceptor } from '~/app/common/interceptors/unauthorized.interceptor';
import { motionEnabled } from '~/app/common/motion/motion';
import { IdlePreloadStrategy } from '~/app/common/routing/idle-preload.strategy';
import { isModalNavigation } from '~/app/common/routing/modal-route';
import { provideRouteScroll } from '~/app/common/routing/route-scroll';
import { FeedbackToastService } from '~/app/common/services/feedback-toast.service';
import { I18nTitleStrategy } from '~/app/common/services/i18n-title.strategy';
import { provideTheme } from '~/app/common/services/theme.providers';
import { provideDemoMode } from '~/app/config/demo-mode';
import { environment } from '~/app/config/environment';
import { provideSessionEndHooks } from '~/app/session-end-hooks';
import { provideAccounts } from '~/modules/accounts/infra/accounts.providers';
import { provideAi } from '~/modules/ai/infra/ai.providers';
import { SessionFacade } from '~/modules/auth/core/facades/session.facade';
import { provideAuth } from '~/modules/auth/infra/auth.providers';
import { provideCards } from '~/modules/cards/infra/cards.providers';
import { provideCategories } from '~/modules/categories/infra/categories.providers';
import { provideNotifications } from '~/modules/notifications/infra/notifications.providers';
import { provideSearch } from '~/modules/search/infra/search.providers';
import { provideTransactions } from '~/modules/transactions/infra/transactions.providers';
import { API_MOCKS } from '~/util/api-mocks';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withPreloading(IdlePreloadStrategy),
      ...(motionEnabled()
        ? [
            withViewTransitions({
              skipInitialTransition: true,
              onViewTransitionCreated: ({ transition, from, to }) => {
                if (!isModalNavigation(from, to)) return;
                transition.ready.catch(() => undefined);
                transition.skipTransition();
              },
            }),
          ]
        : []),
    ),
    { provide: TitleStrategy, useExisting: I18nTitleStrategy },
    provideI18n(),
    provideTheme(),
    provideHttpClient(withFetch(), withInterceptors([unauthorizedInterceptor, authInterceptor])),
    provideDemoMode(),
    { provide: API_MOCKS, useValue: environment.apiMocks },
    provideAuth(),
    provideAccounts(),
    provideCards(),
    provideCategories(),
    provideTransactions(),
    provideNotifications(),
    provideSessionEndHooks(),
    provideAi(),
    provideSearch(),
    provideAppInitializer(() => trackInputModality(inject(DOCUMENT))),
    provideRouteScroll(),
    provideAppInitializer(() => inject(FeedbackToastService).start()),
    provideAppInitializer(() => inject(SessionFacade).restore()),
    provideServiceWorker('sw-push.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};

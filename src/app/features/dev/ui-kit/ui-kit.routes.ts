import { Routes } from '@angular/router';

import { UiKitPage } from '~/app/features/dev/ui-kit/ui-kit.page';
import { REPORTS_PROVIDERS } from '~/app/lazy-providers';

const routes: Routes = [{ path: '', providers: REPORTS_PROVIDERS, component: UiKitPage }];

export default routes;

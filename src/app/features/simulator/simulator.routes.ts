import { Routes } from '@angular/router';

import { pageTitle } from '~/app/common/services/i18n-title.strategy';
import { SimulatorPage } from '~/app/features/simulator/pages/simulator.page';
import { SIMULATOR_PROVIDERS } from '~/app/lazy-providers';

const routes: Routes = [
  {
    path: '',
    providers: SIMULATOR_PROVIDERS,
    children: [{ path: '', component: SimulatorPage, title: pageTitle('simulator') }],
  },
];

export default routes;

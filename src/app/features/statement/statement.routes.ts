import { Routes } from '@angular/router';

import { pageTitle } from '~/app/common/services/i18n-title.strategy';
import { StatementPage } from '~/app/features/statement/pages/statement.page';
import { STATEMENT_PROVIDERS } from '~/app/lazy-providers';

const routes: Routes = [
  {
    path: '',
    providers: STATEMENT_PROVIDERS,
    children: [{ path: '', component: StatementPage, title: pageTitle('statement') }],
  },
];

export default routes;

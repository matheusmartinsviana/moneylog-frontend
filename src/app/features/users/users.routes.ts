import { Routes } from '@angular/router';

import { pageTitle } from '~/app/common/services/i18n-title.strategy';
import { UsersPage } from '~/app/features/users/pages/users.page';
import { USERS_PROVIDERS } from '~/app/lazy-providers';

const routes: Routes = [
  { path: '', providers: USERS_PROVIDERS, component: UsersPage, title: pageTitle('users') },
];

export default routes;

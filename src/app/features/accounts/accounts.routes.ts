import { Routes } from '@angular/router';

import { MODAL_ROUTE } from '~/app/common/routing/modal-route';
import { pageTitle } from '~/app/common/services/i18n-title.strategy';
import { AccountFormPage } from '~/app/features/accounts/pages/account-form.page';
import { AccountsPage } from '~/app/features/accounts/pages/accounts.page';

const routes: Routes = [
  // Criar e editar abrem em modal sobre a lista (`AccountsPage` tem o `<router-outlet>`); a URL é o deep link.
  {
    path: '',
    component: AccountsPage,
    title: pageTitle('accounts'),
    children: [
      { path: 'new', component: AccountFormPage, data: MODAL_ROUTE },
      { path: ':id/edit', component: AccountFormPage, data: MODAL_ROUTE },
    ],
  },
];

export default routes;

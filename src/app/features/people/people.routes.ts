import { Routes } from '@angular/router';

import { MODAL_ROUTE } from '~/app/common/routing/modal-route';
import { pageTitle } from '~/app/common/services/i18n-title.strategy';
import { PeoplePage } from '~/app/features/people/pages/people.page';
import { PersonFormPage } from '~/app/features/people/pages/person-form.page';
import { PersonPage } from '~/app/features/people/pages/person.page';
import { PEOPLE_PROVIDERS } from '~/app/lazy-providers';

const routes: Routes = [
  {
    path: '',
    providers: PEOPLE_PROVIDERS,
    children: [
      // Criar abre em modal sobre a lista; editar, sobre o detalhe da pessoa.
      {
        path: '',
        component: PeoplePage,
        title: pageTitle('people'),
        children: [{ path: 'new', component: PersonFormPage, data: MODAL_ROUTE }],
      },
      {
        path: ':id',
        component: PersonPage,
        title: pageTitle('people'),
        children: [{ path: 'edit', component: PersonFormPage, data: MODAL_ROUTE }],
      },
    ],
  },
];

export default routes;

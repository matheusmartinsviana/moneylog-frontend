import { Routes } from '@angular/router';

import { MODAL_ROUTE } from '~/app/common/routing/modal-route';
import { pageTitle } from '~/app/common/services/i18n-title.strategy';
import { GoalFormPage } from '~/app/features/goals/pages/goal-form.page';
import { GoalSmartFormPage } from '~/app/features/goals/pages/goal-smart-form.page';
import { GoalPage } from '~/app/features/goals/pages/goal.page';
import { GoalsPage } from '~/app/features/goals/pages/goals.page';
import { GOALS_PROVIDERS } from '~/app/lazy-providers';

const routes: Routes = [
  {
    path: '',
    providers: GOALS_PROVIDERS,
    children: [
      {
        path: '',
        component: GoalsPage,
        title: pageTitle('goals'),
        children: [
          { path: 'new', component: GoalFormPage, data: MODAL_ROUTE },
          { path: 'new-smart', component: GoalSmartFormPage, data: MODAL_ROUTE },
        ],
      },
      {
        path: ':id',
        component: GoalPage,
        title: pageTitle('goals'),
        children: [{ path: 'edit', component: GoalFormPage, data: MODAL_ROUTE }],
      },
    ],
  },
];

export default routes;

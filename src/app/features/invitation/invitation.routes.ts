import { Routes } from '@angular/router';

import { pageTitle } from '~/app/common/services/i18n-title.strategy';
import { AcceptInvitationPage } from '~/app/features/invitation/pages/accept-invitation.page';

const routes: Routes = [
  { path: '', component: AcceptInvitationPage, title: pageTitle('invitation') },
];

export default routes;

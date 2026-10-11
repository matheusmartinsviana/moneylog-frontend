import { Provider } from '@angular/core';

import { NotificationsGateway } from '~/modules/notifications/core/interfaces/notifications.gateway';
import { PushDevice } from '~/modules/notifications/core/interfaces/push-device';
import { BrowserPushDevice } from '~/modules/notifications/infra/facades/browser-push-device';
import { NotificationsRequestsFacade } from '~/modules/notifications/infra/facades/notifications-requests.facade';

export function provideNotifications(): Provider[] {
  return [
    { provide: NotificationsGateway, useExisting: NotificationsRequestsFacade },
    { provide: PushDevice, useExisting: BrowserPushDevice },
  ];
}

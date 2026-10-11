import type { PushSubscriptionInput } from '~/modules/notifications/core/types/notification';

export type PushCapability = 'unsupported' | 'ios-needs-install' | 'supported';

export type PushPermission = 'default' | 'granted' | 'denied';

export abstract class PushDevice {
  abstract capability(): PushCapability;
  abstract permission(): PushPermission;
  abstract currentEndpoint(): Promise<string | null>;
  abstract subscribe(publicKey: string): Promise<PushSubscriptionInput>;
  abstract unsubscribe(): Promise<void>;
}

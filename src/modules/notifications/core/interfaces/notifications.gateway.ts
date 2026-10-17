import { Observable } from 'rxjs';

import type {
  AppNotification,
  DailyMessage,
  NotificationSettings,
  NotificationsQuery,
  ProfilePhoto,
  PushConfig,
  PushSubscriptionInput,
  Reminder,
  ReminderInput,
} from '~/modules/notifications/core/types/notification';
import type { Slice } from '~/util/api/slice';

export abstract class NotificationsGateway {
  abstract list(query: NotificationsQuery): Observable<Slice<AppNotification>>;
  abstract unreadCount(): Observable<number>;
  abstract markRead(id: string): Observable<void>;
  abstract markAllRead(): Observable<void>;

  abstract reminders(
    includeDone: boolean,
    page: number,
    pageSize: number,
  ): Observable<Slice<Reminder>>;
  abstract createReminder(input: ReminderInput): Observable<Reminder>;
  abstract updateReminder(id: string, input: ReminderInput): Observable<Reminder>;
  abstract completeReminder(id: string): Observable<Reminder>;
  abstract snoozeReminder(id: string, days: number): Observable<Reminder>;

  abstract settings(): Observable<NotificationSettings>;
  abstract saveSettings(settings: NotificationSettings): Observable<NotificationSettings>;

  abstract uploadProfilePhoto(file: Blob, fileName: string): Observable<ProfilePhoto>;
  abstract profilePhotoContent(): Observable<Blob>;
  abstract removeProfilePhoto(): Observable<void>;

  abstract pushConfig(): Observable<PushConfig>;
  abstract subscribePush(input: PushSubscriptionInput): Observable<string>;
  abstract unsubscribePush(id: string): Observable<void>;

  abstract dailyMessage(): Observable<DailyMessage>;
}

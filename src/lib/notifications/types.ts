export type NotificationType =
  | 'new_course'
  | 'new_lecture'
  | 'new_quiz'
  | 'live_stream'
  | 'custom_admin';

export interface SendNotificationInput {
  type: NotificationType;
  title: string;
  body: string;
  route?: string;
  imageUrl?: string | null;
  sourceId?: string | null;
  /** null = broadcast to all users */
  userId?: string | null;
  skipDuplicateCheck?: boolean;
}

export interface SendNotificationResult {
  notificationId: string;
  pushSent: number;
  pushFailed: number;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  new_course: 'New Course',
  new_lecture: 'New Video',
  new_quiz: 'New Test',
  live_stream: 'Live Now',
  custom_admin: 'Announcement',
};

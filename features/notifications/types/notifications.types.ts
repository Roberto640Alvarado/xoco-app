// Mismo contrato que GET /notifications (xoco-api, NotificationsService).
export type NotificationTone = "info" | "warning" | "success" | "danger";

export interface AppNotification {
  id: string;
  kind: "request" | "movement";
  tone: NotificationTone;
  title: string;
  description: string;
  at: string;
  href: string;
}

export interface NotificationsResponse {
  items: AppNotification[];
  total: number;
}

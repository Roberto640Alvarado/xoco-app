import { apiGet } from "@/lib/api/client";
import type { NotificationsResponse } from "../types/notifications.types";

export function fetchNotifications(sinceMovements?: string) {
  return apiGet<NotificationsResponse>("/notifications", { params: sinceMovements ? { sinceMovements } : undefined });
}

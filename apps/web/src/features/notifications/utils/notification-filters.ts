import {
  isNotificationUnread,
  requiresNotificationAwareness,
  type NotificationListItem,
} from "@safestop/types";

import type { NotificationFilter } from "../types";

export function matchesNotificationFilter(
  item: NotificationListItem,
  filter: NotificationFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "unread":
      return isNotificationUnread(item);
    case "pending-awareness":
      return requiresNotificationAwareness(item);
    case "critical":
      return item.priority === "CRITICAL";
    case "interdiction":
      return item.eventType === "INTERDICTION_CONFIRMED";
    case "ver-and-act":
      return item.eventType === "VER_AND_ACT_REQUIRED";
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

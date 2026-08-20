import type { NotificationListItem } from "@safestop/types";
import { requiresNotificationAwareness, isNotificationUnread } from "@safestop/types";

export const NOTIFICATION_LIST_FILTERS = [
  "all",
  "unread",
  "pendingAwareness",
  "critical",
  "interdiction",
  "verAndAct",
] as const;

export type NotificationListFilter = (typeof NOTIFICATION_LIST_FILTERS)[number];

export function parseNotificationListFilter(
  value: string | string[] | undefined,
): NotificationListFilter | undefined {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) {
    return undefined;
  }

  if (NOTIFICATION_LIST_FILTERS.includes(raw as NotificationListFilter)) {
    return raw as NotificationListFilter;
  }

  if (raw === "pending-awareness") {
    return "pendingAwareness";
  }

  return undefined;
}

export function matchesNotificationFilter(
  item: NotificationListItem,
  filter: NotificationListFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "unread":
      return isNotificationUnread(item);
    case "pendingAwareness":
      return requiresNotificationAwareness(item);
    case "critical":
      return item.priority === "CRITICAL";
    case "interdiction":
      return item.eventType === "INTERDICTION_CONFIRMED";
    case "verAndAct":
      return item.eventType === "VER_AND_ACT_REQUIRED";
    default: {
      const _exhaustive: never = filter;
      return _exhaustive;
    }
  }
}

export function filterNotificationItems(
  items: NotificationListItem[],
  filter: NotificationListFilter,
): NotificationListItem[] {
  return items.filter((item) => matchesNotificationFilter(item, filter));
}

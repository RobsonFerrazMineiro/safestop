import {
  NOTIFICATION_LIST_DEFAULT_LIMIT,
  NOTIFICATION_STALE_TIME_MS,
  type NotificationListItem,
} from "@safestop/types";

export { NOTIFICATION_LIST_DEFAULT_LIMIT, NOTIFICATION_STALE_TIME_MS };
export type { NotificationListItem };

export type NotificationBadgeCounts = {
  unreadCount: number;
  pendingAwarenessCount: number;
};

export type NotificationFilter =
  "all" | "unread" | "pending-awareness" | "critical" | "interdiction" | "ver-and-act";

export const NOTIFICATION_FILTER_OPTIONS: readonly {
  id: NotificationFilter;
  label: string;
}[] = [
  { id: "all", label: "Todas" },
  { id: "unread", label: "Não lidas" },
  { id: "pending-awareness", label: "Pendentes de ciência" },
  { id: "critical", label: "Críticas" },
  { id: "interdiction", label: "Interdições" },
  { id: "ver-and-act", label: "Ver e Agir" },
] as const;

export const NOTIFICATION_POLL_INTERVAL_MS = 60_000;

export const NOTIFICATION_POPOVER_LIMIT = 5;

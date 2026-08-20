import { TENANT_QUERY_KEY_PREFIX } from "./tenant";

export const NOTIFICATIONS_SCOPE = "notifications" as const;

/**
 * Query keys tenant-scoped de notificações (Sprint 3.1).
 * API objeto unificada — Web e Mobile consomem o mesmo pacote.
 */
export const notificationQueryKeys = {
  all: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, NOTIFICATIONS_SCOPE] as const,
  list: (organizationId: string, cursor: string | null = null) =>
    [...notificationQueryKeys.all(organizationId), "list", cursor ?? "initial"] as const,
  unreadCount: (organizationId: string) =>
    [...notificationQueryKeys.all(organizationId), "unread-count"] as const,
};

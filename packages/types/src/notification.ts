/**
 * Notificações internas (Sprint 3.1).
 * Referência: docs/decisions/NOTIFICATIONS-DECISIONS.md; docs/database.md §17
 * Fonte oficial: `notifications` + `notification_events` (SELECT-only no client).
 */

/** Alinhado a `notification_events_event_type_check` (migration 20260817180000). */
export const NOTIFICATION_EVENT_TYPES = [
  "OCCURRENCE_CREATED",
  "DECISION_REQUIRED",
  "VER_AND_ACT_REQUIRED",
  "INTERDICTION_CONFIRMED",
  "MDHO_APPROVAL_REQUIRED",
  "MDHO_RETURNED",
  "MDHO_APPROVED",
  "IMS_REFERENCE_REGISTERED",
  "ACTION_PLAN_CREATED",
  "ACTION_ITEM_ASSIGNED",
  "ACTION_ITEM_SUBMITTED",
  "ACTION_ITEM_VALIDATED",
  "ACTION_ITEM_RETURNED",
  "ACTION_PLAN_COMPLETED",
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

/**
 * PO-NOTIF-6 — previsto em migration futura (`ACTION_DUE`).
 * Não incluído em `NOTIFICATION_EVENT_TYPES` até CHECK do banco ser estendido.
 */
export const NOTIFICATION_EVENT_TYPE_ACTION_DUE = "ACTION_DUE" as const;

/** Alinhado a `notification_events_priority_check` / `notifications_priority_check`. */
export const NOTIFICATION_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

/** PO-NOTIF-5 — eventos com `requires_awareness = true`. */
export const NOTIFICATION_AWARENESS_REQUIRED_EVENT_TYPES = [
  "OCCURRENCE_CREATED",
  "VER_AND_ACT_REQUIRED",
  "INTERDICTION_CONFIRMED",
] as const satisfies readonly NotificationEventType[];

export type NotificationAwarenessRequiredEventType =
  (typeof NOTIFICATION_AWARENESS_REQUIRED_EVENT_TYPES)[number];

export const NOTIFICATION_LIST_DEFAULT_LIMIT = 20;

export const NOTIFICATION_LIST_MAX_LIMIT = 100;

export const NOTIFICATION_STALE_TIME_MS = 30_000;

export type NotificationEvent = {
  id: string;
  organizationId: string;
  occurrenceId: string;
  eventType: NotificationEventType;
  priority: NotificationPriority;
  payload: Record<string, unknown>;
  createdAt: string;
  createdBy: string | null;
};

export type Notification = {
  id: string;
  notificationEventId: string;
  organizationId: string;
  recipientMemberId: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  requiresAwareness: boolean;
  readAt: string | null;
  awarenessConfirmedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
};

/** Item retornado por `list_my_notifications` (camelCase RPC). */
export type NotificationListItem = {
  id: string;
  notificationEventId: string;
  eventType: NotificationEventType;
  occurrenceId: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  requiresAwareness: boolean;
  readAt: string | null;
  awarenessConfirmedAt: string | null;
  createdAt: string;
};

export type ListMyNotificationsInput = {
  organizationId: string;
  cursor?: string | null;
  limit?: number;
};

export type ListMyNotificationsResult = {
  items: NotificationListItem[];
  nextCursor: string | null;
};

export type MarkNotificationReadResult = {
  notificationId: string;
  readAt: string;
  idempotent?: boolean;
};

export type MarkAllNotificationsReadResult = {
  updatedCount: number;
};

export type ConfirmNotificationAwarenessResult = {
  notificationId: string;
  awarenessConfirmedAt: string;
  idempotent?: boolean;
};

export const NOTIFICATION_ERROR_CODES = ["VALIDATION_ERROR", "NOT_FOUND", "FORBIDDEN"] as const;

export type NotificationErrorCode = (typeof NOTIFICATION_ERROR_CODES)[number];

export const NOTIFICATION_DOMAIN_ERROR_CODES = [...NOTIFICATION_ERROR_CODES] as const;

export type NotificationDomainErrorCode = (typeof NOTIFICATION_DOMAIN_ERROR_CODES)[number];

export type NotificationError = {
  code: NotificationErrorCode;
  message: string;
};

export function isNotificationEventType(value: string): value is NotificationEventType {
  return (NOTIFICATION_EVENT_TYPES as readonly string[]).includes(value);
}

export function isNotificationPriority(value: string): value is NotificationPriority {
  return (NOTIFICATION_PRIORITIES as readonly string[]).includes(value);
}

export function isNotificationAwarenessRequiredEventType(
  eventType: NotificationEventType,
): boolean {
  return (NOTIFICATION_AWARENESS_REQUIRED_EVENT_TYPES as readonly string[]).includes(eventType);
}

export function isNotificationErrorCode(value: string): value is NotificationErrorCode {
  return (NOTIFICATION_ERROR_CODES as readonly string[]).includes(value);
}

export function isNotificationDomainErrorCode(value: string): value is NotificationDomainErrorCode {
  return (NOTIFICATION_DOMAIN_ERROR_CODES as readonly string[]).includes(value);
}

export function requiresNotificationAwareness(item: {
  requiresAwareness: boolean;
  awarenessConfirmedAt: string | null;
}): boolean {
  return item.requiresAwareness && item.awarenessConfirmedAt === null;
}

export function isNotificationUnread(item: { readAt: string | null }): boolean {
  return item.readAt === null;
}

/** Payload bruto de `list_my_notifications`. */
export type ListMyNotificationsRpcPayload = {
  id?: string;
  notificationEventId?: string;
  eventType?: string;
  occurrenceId?: string;
  title?: string;
  message?: string;
  priority?: string;
  requiresAwareness?: boolean;
  readAt?: string | null;
  awarenessConfirmedAt?: string | null;
  createdAt?: string;
};

export function mapNotificationListItem(
  payload: ListMyNotificationsRpcPayload,
): NotificationListItem | null {
  if (
    !payload.id ||
    !payload.notificationEventId ||
    !payload.eventType ||
    !isNotificationEventType(payload.eventType) ||
    !payload.occurrenceId ||
    !payload.title ||
    !payload.message ||
    !payload.priority ||
    !isNotificationPriority(payload.priority) ||
    payload.requiresAwareness === undefined ||
    !payload.createdAt
  ) {
    return null;
  }

  return {
    id: payload.id,
    notificationEventId: payload.notificationEventId,
    eventType: payload.eventType,
    occurrenceId: payload.occurrenceId,
    title: payload.title,
    message: payload.message,
    priority: payload.priority,
    requiresAwareness: payload.requiresAwareness,
    readAt: payload.readAt ?? null,
    awarenessConfirmedAt: payload.awarenessConfirmedAt ?? null,
    createdAt: payload.createdAt,
  };
}

export function mapListMyNotificationsResult(data: unknown): ListMyNotificationsResult {
  if (typeof data !== "object" || data === null) {
    return { items: [], nextCursor: null };
  }

  const record = data as {
    items?: unknown;
    nextCursor?: string | null;
  };

  const items = Array.isArray(record.items)
    ? record.items
        .map((item) => mapNotificationListItem(item as ListMyNotificationsRpcPayload))
        .filter((item): item is NotificationListItem => item !== null)
    : [];

  return {
    items,
    nextCursor: record.nextCursor ?? null,
  };
}

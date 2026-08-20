/**
 * Invalidação pós-mutation — Notificações (Sprint 3.1).
 *
 * | Domínio | list | unreadCount |
 * |---------|------|-------------|
 * | read    |  ✓   |      ✓      |
 * | readAll |  ✓   |      ✓      |
 * | awareness | ✓  |      ✓      |
 */

import { notificationQueryKeys } from "./notification";

export const NOTIFICATION_MUTATION_DOMAINS = ["read", "readAll", "awareness"] as const;

export type NotificationMutationDomain = (typeof NOTIFICATION_MUTATION_DOMAINS)[number];

export const NOTIFICATION_INVALIDATION_TARGETS = ["list", "unreadCount"] as const;

export type NotificationInvalidationTarget = (typeof NOTIFICATION_INVALIDATION_TARGETS)[number];

export const NOTIFICATION_INVALIDATION_MATRIX: Record<
  NotificationMutationDomain,
  readonly NotificationInvalidationTarget[]
> = {
  read: ["list", "unreadCount"],
  readAll: ["list", "unreadCount"],
  awareness: ["list", "unreadCount"],
};

export function getNotificationInvalidationTargets(
  domain: NotificationMutationDomain,
): readonly NotificationInvalidationTarget[] {
  return NOTIFICATION_INVALIDATION_MATRIX[domain];
}

export function resolveNotificationInvalidationKeys(
  organizationId: string,
  targets: readonly NotificationInvalidationTarget[],
): readonly (readonly unknown[])[] {
  const keys: (readonly unknown[])[] = [];

  for (const target of targets) {
    switch (target) {
      case "list":
        keys.push(notificationQueryKeys.all(organizationId));
        break;
      case "unreadCount":
        keys.push(notificationQueryKeys.unreadCount(organizationId));
        break;
      default: {
        const _exhaustive: never = target;
        return _exhaustive;
      }
    }
  }

  return keys;
}

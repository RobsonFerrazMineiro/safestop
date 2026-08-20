import { notificationQueryKeys } from "@safestop/query-keys";

export function notificationBadgeCountsQueryKey(organizationId: string) {
  return [...notificationQueryKeys.all(organizationId), "badge-counts"] as const;
}

export function pendingAwarenessForOccurrenceQueryKey(
  organizationId: string,
  occurrenceId: string,
) {
  return [...notificationQueryKeys.all(organizationId), "pending-awareness", occurrenceId] as const;
}

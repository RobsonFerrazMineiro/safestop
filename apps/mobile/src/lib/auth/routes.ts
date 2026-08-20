import type { Href } from "expo-router";

export const authRoutes = {
  login: "/(auth)/login" as Href,
  app: "/(app)" as Href,
  profile: "/(app)/profile" as Href,
  organizations: "/(app)/organizations" as Href,
  occurrences: "/(app)/occurrences" as Href,
  occurrenceNew: "/(app)/occurrences/new" as Href,
  stopWork: "/(app)/stop-work" as Href,
  stopWorkNew: "/(app)/stop-work/new" as Href,
  hseApprovalQueue: "/(app)/approvals/mdho" as Href,
  notifications: "/(app)/notifications" as Href,
  forbidden: "/(app)/forbidden" as Href,
  root: "/" as Href,
} as const;

export function occurrenceDetailRoute(occurrenceId: string): Href {
  return stopWorkDetailRoute(occurrenceId);
}

export const stopWorkRoute = authRoutes.stopWork;
export const stopWorkNewRoute = authRoutes.stopWorkNew;

export function stopWorkDetailRoute(occurrenceId: string): Href {
  return `/(app)/stop-work/${occurrenceId}` as Href;
}

export const hseApprovalQueueRoute = authRoutes.hseApprovalQueue;
export const notificationsRoute = authRoutes.notifications;

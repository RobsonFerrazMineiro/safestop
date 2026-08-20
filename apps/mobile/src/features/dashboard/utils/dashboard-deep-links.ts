import type { Href } from "expo-router";

import { stopWorkDetailRoute, stopWorkRoute } from "@/lib/auth/routes";

/** Deep links canônicos do Dashboard (paridade Web — Sprint 3.2). */
export const dashboardDeepLinks = {
  stopWorkAll: stopWorkRoute,
  stopWorkOccurrence: (occurrenceId: string): Href => stopWorkDetailRoute(occurrenceId),
  notificationsAwareness: "/(app)/notifications?filter=pendingAwareness" as Href,
  actionItemsOverdue: "/(app)/stop-work?dashboardAttention=overdue" as Href,
  actionItemsDueSoon: "/(app)/stop-work?dashboardAttention=due-soon" as Href,
} as const;

export function notificationsAwarenessRoute(): Href {
  return dashboardDeepLinks.notificationsAwareness;
}

export function stopWorkAttentionRoute(kind: "overdue" | "due-soon"): Href {
  return kind === "overdue"
    ? dashboardDeepLinks.actionItemsOverdue
    : dashboardDeepLinks.actionItemsDueSoon;
}

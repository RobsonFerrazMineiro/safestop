import type { Href } from "expo-router";

import { stopWorkDetailRoute, stopWorkRoute } from "@/lib/auth/routes";
import {
  DASHBOARD_ATTENTION_SCOPE,
  type DashboardAttentionFilter,
  type DashboardAttentionScope,
} from "@/features/stop-work/utils/dashboard-list-params";

/** Deep links canônicos do Dashboard (paridade Web — Sprint 3.2). */
export const dashboardDeepLinks = {
  stopWorkAll: stopWorkRoute,
  stopWorkOccurrence: (occurrenceId: string): Href => stopWorkDetailRoute(occurrenceId),
  notificationsAwareness: "/(app)/notifications?filter=pendingAwareness" as Href,
  /** Organizacional — comportamento legado. */
  actionItemsOverdue: "/(app)/stop-work?dashboardAttention=overdue" as Href,
  actionItemsDueSoon: "/(app)/stop-work?dashboardAttention=due-soon" as Href,
} as const;

export function notificationsAwarenessRoute(): Href {
  return dashboardDeepLinks.notificationsAwareness;
}

export function stopWorkAttentionRoute(
  kind: DashboardAttentionFilter,
  scope: DashboardAttentionScope = DASHBOARD_ATTENTION_SCOPE.organization,
): Href {
  const params = new URLSearchParams({
    dashboardAttention: kind,
  });

  if (scope === DASHBOARD_ATTENTION_SCOPE.mine) {
    params.set("dashboardAttentionScope", DASHBOARD_ATTENTION_SCOPE.mine);
  }

  return `/(app)/stop-work?${params.toString()}` as Href;
}

export function stopWorkPersonalAttentionRoute(kind: DashboardAttentionFilter): Href {
  return stopWorkAttentionRoute(kind, DASHBOARD_ATTENTION_SCOPE.mine);
}

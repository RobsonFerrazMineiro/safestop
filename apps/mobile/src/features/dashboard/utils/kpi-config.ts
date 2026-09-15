import {
  DASHBOARD_METRIC_CATALOG,
  type DashboardMetricKey,
  type PermissionCode,
} from "@safestop/types";
import type { Href } from "expo-router";

import { hseApprovalQueueRoute } from "@/lib/auth/routes";
import { DASHBOARD_ATTENTION_SCOPE } from "@/features/stop-work/utils/dashboard-list-params";

import {
  dashboardDeepLinks,
  notificationsAwarenessRoute,
  stopWorkAttentionRoute,
} from "./dashboard-deep-links";

export type HomeKpiTone = "danger" | "warning" | "info" | "neutral";

export function permissionForMetric(key: DashboardMetricKey): PermissionCode | PermissionCode[] {
  switch (key) {
    case "myPendingActions":
    case "myOverdueActions":
    case "myDueSoonActions":
    case "overdueActionItems":
    case "dueSoonActionItems":
    case "openActionPlans":
    case "actionCompletionRate":
      return [
        "action_plan.create",
        "action_plan.manage",
        "action_plan.validate",
        "occurrence.read",
      ];
    case "myPendingAwareness":
    case "scopedPendingAwareness":
      return "notification.read";
    case "pendingAwarenessOrg":
      return "report.read";
    case "mdhoPendingApproval":
      return ["mdho.approve", "mdho.return", "occurrence.read"];
    case "scopedOpenOccurrences":
      return "occurrence.read";
    default:
      return "occurrence.read";
  }
}

export function hasMetricPermission(
  can: (code: PermissionCode) => boolean,
  canAny: (codes: PermissionCode[]) => boolean,
  key: DashboardMetricKey,
): boolean {
  const permission = permissionForMetric(key);

  if (Array.isArray(permission)) {
    return canAny(permission);
  }

  return can(permission);
}

export function toneForHomeMetric(key: DashboardMetricKey): HomeKpiTone {
  switch (key) {
    case "overdueActionItems":
    case "myOverdueActions":
    case "activeInterdictions":
      return "danger";
    case "myPendingAwareness":
    case "scopedPendingAwareness":
    case "pendingAwarenessOrg":
    case "mdhoPendingApproval":
    case "dueSoonActionItems":
    case "myDueSoonActions":
      return "warning";
    case "activeOccurrences":
    case "scopedOpenOccurrences":
      return "info";
    default:
      return "neutral";
  }
}

export function routeForHomeMetric(key: DashboardMetricKey): Href | undefined {
  switch (key) {
    case "myPendingAwareness":
    case "scopedPendingAwareness":
      return notificationsAwarenessRoute();
    case "mdhoPendingApproval":
      return hseApprovalQueueRoute;
    case "myOverdueActions":
      return stopWorkAttentionRoute("overdue", DASHBOARD_ATTENTION_SCOPE.mine);
    case "myDueSoonActions":
      return stopWorkAttentionRoute("due-soon", DASHBOARD_ATTENTION_SCOPE.mine);
    case "myPendingActions":
      return stopWorkAttentionRoute("pending", DASHBOARD_ATTENTION_SCOPE.mine);
    case "dueSoonActionItems":
      return stopWorkAttentionRoute("due-soon");
    case "scopedOpenOccurrences":
    case "activeOccurrences":
    case "pendingEvaluation":
    case "activeInterdictions":
    case "awaitingValidation":
    case "openActionPlans":
      return dashboardDeepLinks.stopWorkAll;
    default:
      return undefined;
  }
}

export function labelForMetric(key: DashboardMetricKey): string {
  return DASHBOARD_METRIC_CATALOG[key].label;
}

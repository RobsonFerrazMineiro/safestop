import type { PermissionCode } from "@safestop/types";
import { DASHBOARD_METRIC_CATALOG, type DashboardMetricKey } from "@safestop/types";

import { dashboardDeepLinks } from "./dashboard-deep-links";

export type KpiCardConfig = {
  metricKey: DashboardMetricKey;
  value: number;
  href?: string;
  permission: PermissionCode | PermissionCode[];
  tone?: "default" | "destructive" | "warning" | "info" | "success";
};

export function permissionForMetric(key: DashboardMetricKey): PermissionCode | PermissionCode[] {
  switch (key) {
    case "myPendingActions":
    case "myOverdueActions":
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

export function hrefForMetric(key: DashboardMetricKey): string | undefined {
  switch (key) {
    case "myPendingAwareness":
    case "scopedPendingAwareness":
    case "pendingAwarenessOrg":
      return dashboardDeepLinks.notificationsPendingAwareness;
    case "mdhoPendingApproval":
      return dashboardDeepLinks.mdhoApprovals;
    case "overdueActionItems":
    case "myOverdueActions":
      return dashboardDeepLinks.actionItemsOverdue;
    case "dueSoonActionItems":
      return dashboardDeepLinks.actionItemsDueSoon;
    case "activeOccurrences":
      return dashboardDeepLinks.stopWorkActive;
    case "scopedOpenOccurrences":
      return dashboardDeepLinks.stopWorkActiveOperational;
    case "pendingEvaluation":
      return dashboardDeepLinks.stopWorkPendingEvaluation;
    case "activeInterdictions":
      return dashboardDeepLinks.stopWorkActiveInterdictions;
    case "awaitingValidation":
      return dashboardDeepLinks.stopWorkAwaitingValidation;
    case "openActionPlans":
      return dashboardDeepLinks.stopWorkOpenActionPlans;
    default:
      return undefined;
  }
}

export function toneForMetric(key: DashboardMetricKey): KpiCardConfig["tone"] {
  switch (key) {
    case "overdueActionItems":
    case "myOverdueActions":
      return "destructive";
    case "myPendingAwareness":
    case "scopedPendingAwareness":
    case "pendingAwarenessOrg":
    case "mdhoPendingApproval":
      return "warning";
    case "activeInterdictions":
      return "destructive";
    case "dueSoonActionItems":
      return "warning";
    case "activeOccurrences":
      return "info";
    default:
      return "default";
  }
}

export function detailForMetric(key: DashboardMetricKey): string {
  return DASHBOARD_METRIC_CATALOG[key].stock ? "Independente do período" : "No período selecionado";
}

export function canAccessDashboard(
  can: (code: PermissionCode) => boolean,
  canAny: (codes: PermissionCode[]) => boolean,
): boolean {
  return (
    can("occurrence.read") ||
    can("notification.read") ||
    can("report.read") ||
    canAny(["action_plan.create", "action_plan.manage", "action_plan.validate"]) ||
    canAny(["mdho.approve", "mdho.return"])
  );
}

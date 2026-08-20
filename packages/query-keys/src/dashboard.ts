import type { DashboardKpiFilters, DashboardPeriodFilter } from "@safestop/types";

import { TENANT_QUERY_KEY_PREFIX } from "./tenant";

export const DASHBOARD_SCOPE = "dashboard" as const;

export const dashboardKeys = {
  all: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, DASHBOARD_SCOPE] as const,
  kpis: (organizationId: string, filters: DashboardKpiFilters = {}) =>
    [...dashboardKeys.all(organizationId), "kpis", filters] as const,
  distribution: (organizationId: string, filters: { period?: DashboardPeriodFilter | null } = {}) =>
    [...dashboardKeys.all(organizationId), "distribution", filters] as const,
  attention: (organizationId: string) =>
    [...dashboardKeys.all(organizationId), "attention"] as const,
  recentOccurrences: (organizationId: string) =>
    [...dashboardKeys.all(organizationId), "recent-occurrences"] as const,
};

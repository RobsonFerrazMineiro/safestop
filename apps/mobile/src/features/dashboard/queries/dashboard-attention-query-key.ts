import { DASHBOARD_DUE_SOON_DAYS_DEFAULT } from "@safestop/types";

import { dashboardKeys } from "@/features/dashboard/queries/dashboard-keys";
import type { DashboardAttentionScope } from "@/features/stop-work/utils/dashboard-list-params";

/** Query key local: scope separa cache pessoal × organizacional sem alterar packages/query-keys. */
export function dashboardAttentionQueryKey(
  organizationId: string,
  scope: DashboardAttentionScope,
  dueSoonDays: number = DASHBOARD_DUE_SOON_DAYS_DEFAULT,
) {
  return [...dashboardKeys.attention(organizationId), scope, dueSoonDays] as const;
}

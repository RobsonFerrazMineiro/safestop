import type { DashboardAccessContext, DashboardDistributionByStatusFamily } from "@safestop/types";
import {
  canAccessOccurrenceMetrics,
  DASHBOARD_OCCURRENCE_STATUS_FAMILIES,
  DASHBOARD_OCCURRENCE_STATUSES_BY_FAMILY,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import { countRows } from "./utils/count-rows";

export async function getOccurrencesByStatusFamily(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<DashboardDistributionByStatusFamily | null> {
  if (!canAccessOccurrenceMetrics(access)) {
    return null;
  }

  const supabase = createClient();

  const counts = await Promise.all(
    DASHBOARD_OCCURRENCE_STATUS_FAMILIES.map((family) =>
      countRows(supabase, "occurrences", (query) =>
        query
          .eq("organization_id", organizationId)
          .in("status", [...DASHBOARD_OCCURRENCE_STATUSES_BY_FAMILY[family]]),
      ),
    ),
  );

  return Object.fromEntries(
    DASHBOARD_OCCURRENCE_STATUS_FAMILIES.map((family, index) => [family, counts[index] ?? 0]),
  ) as DashboardDistributionByStatusFamily;
}

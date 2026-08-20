import type { DashboardAccessContext, OccurrenceKpis } from "@safestop/types";
import {
  canAccessOccurrenceMetrics,
  DASHBOARD_ACTIVE_INTERDICTION_STATUSES,
  DASHBOARD_AWAITING_VALIDATION_STATUS,
  DASHBOARD_PENDING_EVALUATION_STATUSES,
  DASHBOARD_TERMINAL_OCCURRENCE_STATUSES,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import { countRows } from "./utils/count-rows";

export async function getOccurrenceKpis(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<OccurrenceKpis | null> {
  if (!canAccessOccurrenceMetrics(access)) {
    return null;
  }

  const supabase = createClient();

  const [activeOccurrences, pendingEvaluation, activeInterdictions, awaitingValidation] =
    await Promise.all([
      countRows(supabase, "occurrences", (query) =>
        query
          .eq("organization_id", organizationId)
          .not("status", "in", `(${DASHBOARD_TERMINAL_OCCURRENCE_STATUSES.join(",")})`),
      ),
      countRows(supabase, "occurrences", (query) =>
        query
          .eq("organization_id", organizationId)
          .in("status", [...DASHBOARD_PENDING_EVALUATION_STATUSES]),
      ),
      countRows(supabase, "occurrences", (query) =>
        query
          .eq("organization_id", organizationId)
          .in("status", [...DASHBOARD_ACTIVE_INTERDICTION_STATUSES]),
      ),
      countRows(supabase, "occurrences", (query) =>
        query
          .eq("organization_id", organizationId)
          .eq("status", DASHBOARD_AWAITING_VALIDATION_STATUS),
      ),
    ]);

  return {
    activeOccurrences,
    activeInterdictions,
    pendingEvaluation,
    awaitingValidation,
  };
}

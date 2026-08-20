import type { DashboardAccessContext } from "@safestop/types";
import {
  canAccessOccurrenceMetrics,
  DASHBOARD_TERMINAL_OCCURRENCE_STATUSES,
} from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

export async function getActiveOccurrencesCount(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<number | null> {
  if (!canAccessOccurrenceMetrics(access)) {
    return null;
  }

  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from("occurrences")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .not("status", "in", `(${DASHBOARD_TERMINAL_OCCURRENCE_STATUSES.join(",")})`);

  if (error) {
    throw new Error("Não foi possível carregar ocorrências abertas.");
  }

  return count ?? 0;
}

import type { DashboardAccessContext } from "@safestop/types";
import {
  canAccessActionPlanMetrics,
  canAccessMdhoPendingApproval,
  DASHBOARD_MDHO_PENDING_APPROVAL_STATUS,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import { countRows } from "./utils/count-rows";

export async function getMdhoPendingApprovalCount(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<number | null> {
  if (!canAccessMdhoPendingApproval(access)) {
    return null;
  }

  const supabase = createClient();

  const { count, error } = await supabase
    .from("mdho_assessments")
    .select("id, occurrences!inner(status)", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", DASHBOARD_MDHO_PENDING_APPROVAL_STATUS)
    .eq("occurrences.status", "AGUARDANDO_APROVACAO_HSE");

  if (error) {
    throw new Error("Não foi possível carregar MDHO aguardando aprovação.");
  }

  return count ?? 0;
}

export async function getOpenActionPlansCount(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<number | null> {
  if (!canAccessActionPlanMetrics(access)) {
    return null;
  }

  const supabase = createClient();

  return countRows(supabase, "action_plans", (query) =>
    query.eq("organization_id", organizationId).not("status", "in", "(COMPLETED,CANCELLED)"),
  );
}

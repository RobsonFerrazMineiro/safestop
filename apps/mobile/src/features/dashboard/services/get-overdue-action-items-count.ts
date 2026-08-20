import type { DashboardAccessContext } from "@safestop/types";
import {
  canAccessActionPlanMetrics,
  DASHBOARD_CLOSED_ACTION_ITEM_STATUSES,
  isOverdueActionItem,
} from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

export async function getOverdueActionItemsCount(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<number | null> {
  if (!canAccessActionPlanMetrics(access)) {
    return null;
  }

  const supabase = getSupabaseClient();
  const now = new Date();

  const { data, error } = await supabase
    .from("action_items")
    .select("status, due_at")
    .eq("organization_id", organizationId)
    .not("status", "in", `(${DASHBOARD_CLOSED_ACTION_ITEM_STATUSES.join(",")})`);

  if (error) {
    throw new Error("Não foi possível carregar ações em atraso.");
  }

  return (data ?? []).filter((row) =>
    isOverdueActionItem({
      status: row.status as Parameters<typeof isOverdueActionItem>[0]["status"],
      dueAt: row.due_at,
      now,
    }),
  ).length;
}

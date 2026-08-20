import type { DashboardAccessContext, MyActionItemsSummary } from "@safestop/types";
import {
  DASHBOARD_CLOSED_ACTION_ITEM_STATUSES,
  isMyPendingActionItem,
  isOverdueActionItem,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

type ActionItemRow = {
  status: string;
  due_at: string;
};

export async function getMyActionItemsSummary(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<MyActionItemsSummary> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("action_items")
    .select("status, due_at")
    .eq("organization_id", organizationId)
    .eq("responsible_member_id", access.recipientMemberId)
    .not("status", "in", `(${DASHBOARD_CLOSED_ACTION_ITEM_STATUSES.join(",")})`);

  if (error) {
    throw new Error("Não foi possível carregar suas ações pendentes.");
  }

  const rows = (data ?? []) as ActionItemRow[];
  const now = new Date();

  let myPendingActions = 0;
  let myOverdueActions = 0;

  for (const row of rows) {
    const status = row.status as Parameters<typeof isMyPendingActionItem>[0];

    if (isMyPendingActionItem(status)) {
      myPendingActions += 1;
    }

    if (
      isOverdueActionItem({
        status,
        dueAt: row.due_at,
        now,
      })
    ) {
      myOverdueActions += 1;
    }
  }

  return { myPendingActions, myOverdueActions };
}

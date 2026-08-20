import {
  DASHBOARD_CLOSED_ACTION_ITEM_STATUSES,
  isMyPendingActionItem,
  type DashboardAccessContext,
} from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

import { getActionItemsAttention } from "./get-action-items-attention";

type ActionItemNavigationRow = {
  status: string;
  due_at: string;
  action_plans: { occurrence_id: string } | { occurrence_id: string }[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

async function getMyPendingActionNavigationTarget(
  organizationId: string,
  responsibleMemberId: string,
): Promise<string | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("action_items")
    .select(
      `
        status,
        due_at,
        action_plans ( occurrence_id )
      `,
    )
    .eq("organization_id", organizationId)
    .eq("responsible_member_id", responsibleMemberId)
    .not("status", "in", `(${DASHBOARD_CLOSED_ACTION_ITEM_STATUSES.join(",")})`)
    .order("due_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível localizar suas ações.");
  }

  const rows = (data ?? []) as ActionItemNavigationRow[];

  for (const row of rows) {
    const status = row.status as Parameters<typeof isMyPendingActionItem>[0];
    const plan = normalizeJoin(row.action_plans);
    const occurrenceId = plan?.occurrence_id;

    if (!occurrenceId || !isMyPendingActionItem(status)) {
      continue;
    }

    return occurrenceId;
  }

  return null;
}

export async function getMyActionNavigationTarget(
  organizationId: string,
  access: DashboardAccessContext,
  kind: "overdue" | "pending",
): Promise<string | null> {
  if (kind === "overdue") {
    const attention = await getActionItemsAttention(organizationId, access);
    return attention.overdueItems[0]?.occurrenceId ?? null;
  }

  return getMyPendingActionNavigationTarget(organizationId, access.recipientMemberId);
}

export async function getOverdueActionNavigationTarget(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<string | null> {
  const attention = await getActionItemsAttention(organizationId, access);
  return attention.overdueItems[0]?.occurrenceId ?? null;
}

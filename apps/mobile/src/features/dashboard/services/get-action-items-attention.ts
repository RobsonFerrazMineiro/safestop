import type {
  DashboardAccessContext,
  DashboardActionItemAttentionItem,
  DashboardKpiFilters,
} from "@safestop/types";
import {
  canAccessActionPlanMetrics,
  DASHBOARD_CLOSED_ACTION_ITEM_STATUSES,
  DASHBOARD_DUE_SOON_DAYS_DEFAULT,
  isDueSoonActionItem,
  isMyPendingActionItem,
  isOverdueActionItem,
} from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";
import {
  DASHBOARD_ATTENTION_SCOPE,
  type DashboardAttentionScope,
} from "@/features/stop-work/utils/dashboard-list-params";

/**
 * Extensão Mobile do DTO de attention.
 * `pendingItems` é contrato local (não exige alteração em @safestop/types).
 * Preenchido para scope mine e organization; o consumidor Home usa apenas mine.
 */
export type MobileActionItemsAttention = {
  pendingCount: number | null;
  overdueCount: number | null;
  dueSoonCount: number | null;
  pendingItems: DashboardActionItemAttentionItem[];
  overdueItems: DashboardActionItemAttentionItem[];
  dueSoonItems: DashboardActionItemAttentionItem[];
};

const EMPTY_ATTENTION: MobileActionItemsAttention = {
  pendingCount: null,
  overdueCount: null,
  dueSoonCount: null,
  pendingItems: [],
  overdueItems: [],
  dueSoonItems: [],
};

type ActionItemAttentionRow = {
  id: string;
  title: string;
  due_at: string;
  status: string;
  action_plan_id: string;
  action_plans: { occurrence_id: string } | { occurrence_id: string }[] | null;
};

type GetActionItemsAttentionOptions = Pick<DashboardKpiFilters, "dueSoonDays"> & {
  scope?: DashboardAttentionScope;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapAttentionItem(row: ActionItemAttentionRow): DashboardActionItemAttentionItem {
  const plan = normalizeJoin(row.action_plans);

  return {
    id: row.id,
    title: row.title,
    dueAt: row.due_at,
    status: row.status,
    actionPlanId: row.action_plan_id,
    occurrenceId: plan?.occurrence_id ?? null,
  };
}

export async function getActionItemsAttention(
  organizationId: string,
  access: DashboardAccessContext,
  options: GetActionItemsAttentionOptions = {},
): Promise<MobileActionItemsAttention> {
  if (!canAccessActionPlanMetrics(access)) {
    return EMPTY_ATTENTION;
  }

  const supabase = getSupabaseClient();
  const dueSoonDays = options.dueSoonDays ?? DASHBOARD_DUE_SOON_DAYS_DEFAULT;
  const scope = options.scope ?? DASHBOARD_ATTENTION_SCOPE.organization;
  const now = new Date();

  let query = supabase
    .from("action_items")
    .select(
      `
        id,
        title,
        due_at,
        status,
        action_plan_id,
        action_plans ( occurrence_id )
      `,
    )
    .eq("organization_id", organizationId)
    .not("status", "in", `(${DASHBOARD_CLOSED_ACTION_ITEM_STATUSES.join(",")})`)
    .order("due_at", { ascending: true });

  if (scope === DASHBOARD_ATTENTION_SCOPE.mine) {
    query = query.eq("responsible_member_id", access.recipientMemberId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Não foi possível carregar ações em atenção.");
  }

  const rows = (data ?? []) as ActionItemAttentionRow[];
  const pendingItems: DashboardActionItemAttentionItem[] = [];
  const overdueItems: DashboardActionItemAttentionItem[] = [];
  const dueSoonItems: DashboardActionItemAttentionItem[] = [];

  for (const row of rows) {
    const status = row.status as Parameters<typeof isOverdueActionItem>[0]["status"];
    const mapped = mapAttentionItem(row);
    const input = { status, dueAt: row.due_at, now };

    if (isMyPendingActionItem(status)) {
      pendingItems.push(mapped);
    }

    if (isOverdueActionItem(input)) {
      overdueItems.push(mapped);
      continue;
    }

    if (isDueSoonActionItem(input, dueSoonDays)) {
      dueSoonItems.push(mapped);
    }
  }

  return {
    pendingCount: pendingItems.length,
    overdueCount: overdueItems.length,
    dueSoonCount: dueSoonItems.length,
    pendingItems,
    overdueItems,
    dueSoonItems,
  };
}

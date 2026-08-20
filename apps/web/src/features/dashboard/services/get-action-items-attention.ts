import type {
  DashboardAccessContext,
  DashboardActionItemAttentionItem,
  DashboardActionItemsAttention,
  DashboardKpiFilters,
} from "@safestop/types";
import {
  canAccessActionPlanMetrics,
  DASHBOARD_CLOSED_ACTION_ITEM_STATUSES,
  DASHBOARD_DUE_SOON_DAYS_DEFAULT,
  isDueSoonActionItem,
  isOverdueActionItem,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

/**
 * Drill-down de ações em atenção (listas overdue/dueSoon).
 *
 * Decisão S32-FIN (BACKEND): **mantém query client-side** — não criar RPC
 * `get_dashboard_action_items_attention`. Motivos:
 * - KPIs de contagem já vêm de `get_dashboard_kpis` (SECURITY DEFINER).
 * - RLS de `action_items` replica o gate da RPC (`occurrence.read` + `can_access_occurrence`).
 * - Drill-down é leitura escopada por ocorrência acessível — não exige agregação org-wide.
 * - Fórmulas overdue/dueSoon centralizadas em `@safestop/types` (paridade Web/Mobile).
 * QA: supabase/scripts/qa-dashboard-3.2.mjs (DASH-32-10/11).
 */

const EMPTY_ATTENTION: DashboardActionItemsAttention = {
  overdueCount: null,
  dueSoonCount: null,
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
  filters: Pick<DashboardKpiFilters, "dueSoonDays"> = {},
): Promise<DashboardActionItemsAttention> {
  if (!canAccessActionPlanMetrics(access)) {
    return EMPTY_ATTENTION;
  }

  const supabase = createClient();
  const dueSoonDays = filters.dueSoonDays ?? DASHBOARD_DUE_SOON_DAYS_DEFAULT;
  const now = new Date();

  const { data, error } = await supabase
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

  if (error) {
    throw new Error("Não foi possível carregar ações em atenção.");
  }

  const rows = (data ?? []) as ActionItemAttentionRow[];
  const overdueItems: DashboardActionItemAttentionItem[] = [];
  const dueSoonItems: DashboardActionItemAttentionItem[] = [];

  for (const row of rows) {
    const status = row.status as Parameters<typeof isOverdueActionItem>[0]["status"];
    const input = { status, dueAt: row.due_at, now };

    if (isOverdueActionItem(input)) {
      overdueItems.push(mapAttentionItem(row));
      continue;
    }

    if (isDueSoonActionItem(input, dueSoonDays)) {
      dueSoonItems.push(mapAttentionItem(row));
    }
  }

  return {
    overdueCount: overdueItems.length,
    dueSoonCount: dueSoonItems.length,
    overdueItems,
    dueSoonItems,
  };
}

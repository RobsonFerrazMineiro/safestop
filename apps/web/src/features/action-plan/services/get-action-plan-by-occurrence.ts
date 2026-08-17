import { isActionPlanStatus } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import type { ActionPlanEnriched } from "../types";

type ActionPlanRow = {
  id: string;
  occurrence_id: string;
  organization_id: string;
  status: string;
  summary: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  closed_at: string | null;
};

function mapActionPlanRow(row: ActionPlanRow): ActionPlanEnriched | null {
  if (!isActionPlanStatus(row.status)) {
    return null;
  }

  return {
    id: row.id,
    occurrenceId: row.occurrence_id,
    organizationId: row.organization_id,
    status: row.status,
    summary: row.summary,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
  };
}

const PLAN_SELECT = `
  id,
  occurrence_id,
  organization_id,
  status,
  summary,
  created_at,
  created_by,
  updated_at,
  closed_at
`;

export async function getActionPlanByOccurrence(
  organizationId: string,
  occurrenceId: string,
): Promise<ActionPlanEnriched | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("action_plans")
    .select(PLAN_SELECT)
    .eq("organization_id", organizationId)
    .eq("occurrence_id", occurrenceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar o Plano de Ação.");
  }

  if (!data) {
    return null;
  }

  return mapActionPlanRow(data as ActionPlanRow);
}

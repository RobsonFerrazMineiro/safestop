import { getSupabaseClient } from "@/lib/auth/client";

import { mapActionPlanRow } from "./map-action-plan";
import type { ActionPlanEnriched } from "../types";

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
  const supabase = getSupabaseClient();

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

  return mapActionPlanRow(data);
}

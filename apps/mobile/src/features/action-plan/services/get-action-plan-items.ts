import { getSupabaseClient } from "@/lib/auth/client";

import { mapActionItemRow } from "./map-action-plan";
import type { ActionItemEnriched } from "../types";

const ITEM_SELECT = `
  id,
  action_plan_id,
  organization_id,
  title,
  description,
  responsible_member_id,
  responsible_organization_id,
  due_at,
  priority,
  status,
  completion_description,
  completed_at,
  completed_by,
  validated_at,
  validated_by,
  validation_note,
  created_at,
  updated_at,
  responsible_member:organization_members!action_items_responsible_member_org_fk(
    profiles:profile_id(full_name)
  )
`;

export async function getActionPlanItems(planId: string): Promise<ActionItemEnriched[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("action_items")
    .select(ITEM_SELECT)
    .eq("action_plan_id", planId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar as ações do plano.");
  }

  return (data ?? [])
    .map((row) => mapActionItemRow(row))
    .filter((item): item is ActionItemEnriched => item !== null);
}

import { createClient } from "@/lib/auth/client";

export async function getOpenActionPlanOccurrenceIds(organizationId: string): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("action_plans")
    .select("occurrence_id")
    .eq("organization_id", organizationId)
    .not("status", "in", "(COMPLETED,CANCELLED)");

  if (error) {
    throw new Error("Não foi possível carregar planos de ação abertos.");
  }

  const ids = new Set<string>();

  for (const row of data ?? []) {
    if (row.occurrence_id) {
      ids.add(row.occurrence_id);
    }
  }

  return [...ids];
}

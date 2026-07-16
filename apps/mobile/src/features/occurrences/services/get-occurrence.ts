import { getSupabaseClient } from "@/lib/auth/client";

import { mapOccurrenceDetailsRow, type OccurrenceDetailsRow } from "./map-occurrence";

const OCCURRENCE_DETAIL_SELECT = `
  id,
  public_code,
  title,
  status,
  severity,
  created_at,
  task_description,
  location_description,
  condition_description,
  immediate_action_description,
  decision_type,
  latitude,
  longitude,
  location_accuracy,
  occurred_at,
  stopped_at,
  organization_id,
  area_id,
  unit_id,
  contract_id,
  contractor_organization_id,
  created_by,
  evaluated_at,
  released_at,
  closed_at,
  cancelled_at,
  areas (name),
  profiles:created_by (full_name)
`;

type GetOccurrenceParams = {
  occurrenceId: string;
  organizationId: string;
};

export async function getOccurrence(params: GetOccurrenceParams) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("occurrences")
    .select(OCCURRENCE_DETAIL_SELECT)
    .eq("id", params.occurrenceId)
    .eq("organization_id", params.organizationId)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar a ocorrência.");
  }

  if (!data) {
    return null;
  }

  return mapOccurrenceDetailsRow(data as OccurrenceDetailsRow);
}

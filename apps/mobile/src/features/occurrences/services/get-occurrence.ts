import { getSupabaseClient } from "@/lib/auth/client";

import { mapOccurrenceDetailsRow, type OccurrenceDetailsRow } from "./map-occurrence";
import { buildOccurrenceDetailLookup } from "../utils/workspace-create-rules";

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
  origin_organization_id,
  workspace_id,
  area_id,
  unit_id,
  contract_id,
  contractor_organization_id,
  created_by,
  evaluated_at,
  released_at,
  closed_at,
  cancelled_at,
  assigned_evaluator_id,
  ims_reference_code,
  ims_reference_registered_at,
  ims_reference_registered_by,
  ims_reference_updated_at,
  ims_reference_updated_by,
  occurrence_decisions (
    id,
    decision_type,
    decision_reason,
    decided_by,
    decided_at,
    created_at,
    profiles:decided_by (full_name)
  ),
  areas (name),
  profiles:created_by (full_name),
  evaluator:profiles!occurrences_assigned_evaluator_id_fkey (full_name),
  ims_registered_by:profiles!occurrences_ims_reference_registered_by_fkey (full_name),
  ims_updated_by:profiles!occurrences_ims_reference_updated_by_fkey (full_name),
  contractor_organizations:contractor_organization_id (name),
  origin_organizations:organizations!occurrences_origin_organization_id_fkey (name)
`;

type GetOccurrenceParams = {
  occurrenceId: string;
  organizationId: string;
};

/**
 * Detalhe por id. Gate 13X.4: NÃO filtra pela EMPRESA atuante.
 * `organizationId` permanece na assinatura para query key / callers; RLS autoriza.
 */
export async function getOccurrence(params: GetOccurrenceParams) {
  const supabase = getSupabaseClient();
  const lookup = buildOccurrenceDetailLookup(params.occurrenceId);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  if (lookup.filterByActingOrganization) {
    throw new Error("Lookup de detalhe não deve filtrar pela EMPRESA atuante.");
  }

  const { data, error } = await supabase
    .from("occurrences")
    .select(OCCURRENCE_DETAIL_SELECT)
    .eq("id", lookup.occurrenceId)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar a ocorrência.");
  }

  if (!data) {
    return null;
  }

  return mapOccurrenceDetailsRow(data as OccurrenceDetailsRow);
}

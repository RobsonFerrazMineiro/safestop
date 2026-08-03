import type { OccurrenceListFilters } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import { mapOccurrenceDetailRow, mapOccurrenceSummaryRows } from "../utils/map-occurrence";

const LIST_SELECT = `
  id,
  public_code,
  title,
  status,
  severity,
  created_at,
  areas ( name ),
  profiles!occurrences_created_by_fkey ( full_name ),
  contractor_organizations:organizations!occurrences_contractor_organization_id_fkey ( name )
`;

const DETAIL_SELECT = `
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
  ims_reference_code,
  ims_reference_registered_at,
  ims_reference_registered_by,
  ims_reference_updated_at,
  ims_reference_updated_by,
  assigned_evaluator_id,
  evaluator:profiles!occurrences_assigned_evaluator_id_fkey ( full_name ),
  ims_registered_by_profile:profiles!occurrences_ims_reference_registered_by_fkey ( full_name ),
  ims_updated_by_profile:profiles!occurrences_ims_reference_updated_by_fkey ( full_name ),
  occurrence_decisions (
    id,
    decision_type,
    decision_reason,
    decided_by,
    decided_at,
    created_at,
    profiles!occurrence_decisions_decided_by_fkey ( full_name )
  ),
  areas ( name ),
  profiles!occurrences_created_by_fkey ( full_name ),
  contractor_organizations:organizations!occurrences_contractor_organization_id_fkey ( name )
`;

type ListRow = Parameters<typeof mapOccurrenceSummaryRows>[0][number];
type DetailRow = NonNullable<Parameters<typeof mapOccurrenceDetailRow>[0]>;

export async function getOccurrences(organizationId: string, filters: OccurrenceListFilters = {}) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  let query = supabase
    .from("occurrences")
    .select(LIST_SELECT)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (filters.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  }

  if (filters.severity) {
    query = query.eq("severity", filters.severity);
  }

  if (filters.imsReferenceCode?.trim()) {
    query = query.ilike("ims_reference_code", `%${filters.imsReferenceCode.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Não foi possível carregar as ocorrências.");
  }

  return mapOccurrenceSummaryRows((data ?? []) as ListRow[]);
}

export async function getOccurrence(organizationId: string, occurrenceId: string) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("occurrences")
    .select(DETAIL_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", occurrenceId)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar a ocorrência.");
  }

  if (!data) {
    return null;
  }

  return mapOccurrenceDetailRow(data as DetailRow);
}

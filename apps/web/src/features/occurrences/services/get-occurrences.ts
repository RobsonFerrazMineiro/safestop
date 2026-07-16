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
  profiles!occurrences_created_by_fkey ( full_name )
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
  areas ( name ),
  profiles!occurrences_created_by_fkey ( full_name )
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

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.severity) {
    query = query.eq("severity", filters.severity);
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

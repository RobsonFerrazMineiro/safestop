import type { OccurrenceListFilters } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapOccurrenceSummaryRow, type OccurrenceSummaryRow } from "./map-occurrence";

const OCCURRENCE_LIST_SELECT = `
  id,
  public_code,
  title,
  status,
  severity,
  created_at,
  areas (name),
  profiles:created_by (full_name)
`;

type GetOccurrencesParams = {
  organizationId: string;
  filters?: OccurrenceListFilters;
};

export async function getOccurrences(params: GetOccurrencesParams) {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  let query = supabase
    .from("occurrences")
    .select(OCCURRENCE_LIST_SELECT)
    .eq("organization_id", params.organizationId)
    .order("created_at", { ascending: false });

  if (params.filters?.status) {
    query = query.eq("status", params.filters.status);
  }

  if (params.filters?.severity) {
    query = query.eq("severity", params.filters.severity);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Não foi possível carregar as ocorrências.");
  }

  return (data as OccurrenceSummaryRow[])
    .map(mapOccurrenceSummaryRow)
    .filter((occurrence): occurrence is NonNullable<typeof occurrence> => occurrence !== null);
}

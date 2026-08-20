import { createClient } from "@/lib/auth/client";

import type { DashboardScopeOccurrenceRow } from "../types/scope-filters";

type ScopeOccurrenceDbRow = {
  id: string;
  status: string;
  area_id: string;
  contract_id: string | null;
  contractor_organization_id: string | null;
  created_at: string;
  areas: { name: string } | { name: string }[] | null;
  contractor_organizations: { name: string } | { name: string }[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function getDashboardScopeOccurrences(
  organizationId: string,
): Promise<DashboardScopeOccurrenceRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("occurrences")
    .select(
      `
        id,
        status,
        area_id,
        contract_id,
        contractor_organization_id,
        created_at,
        areas ( name ),
        contractor_organizations:organizations!occurrences_contractor_organization_id_fkey ( name )
      `,
    )
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error("Não foi possível carregar ocorrências para filtros locais.");
  }

  return ((data ?? []) as ScopeOccurrenceDbRow[]).map((row) => {
    const area = normalizeJoin(row.areas);
    const contractor = normalizeJoin(row.contractor_organizations);

    return {
      id: row.id,
      status: row.status,
      areaId: row.area_id,
      areaName: area?.name ?? null,
      contractId: row.contract_id,
      contractorOrganizationId: row.contractor_organization_id,
      contractorOrganizationName: contractor?.name ?? null,
      createdAt: row.created_at,
    };
  });
}

export async function getOccurrenceScopeMap(
  organizationId: string,
): Promise<Map<string, DashboardScopeOccurrenceRow>> {
  const rows = await getDashboardScopeOccurrences(organizationId);
  return new Map(rows.map((row) => [row.id, row]));
}

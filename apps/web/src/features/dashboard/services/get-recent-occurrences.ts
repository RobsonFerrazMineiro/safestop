import type { DashboardAccessContext, DashboardRecentOccurrenceItem } from "@safestop/types";
import { canAccessOccurrenceMetrics, DASHBOARD_RECENT_OCCURRENCES_LIMIT } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import type { DashboardScopeFilters } from "../types/scope-filters";
import { hasActiveDashboardScopeFilters } from "../types/scope-filters";
import { matchesDashboardScopeFilters } from "../utils/matches-scope-filters";

type RecentOccurrenceRow = {
  id: string;
  public_code: string;
  title: string;
  status: string;
  severity: string;
  created_at: string;
  area_id: string;
  contract_id: string | null;
  contractor_organization_id: string | null;
  areas: { name: string } | { name: string }[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function getRecentOccurrences(
  organizationId: string,
  access: DashboardAccessContext,
  options?: {
    limit?: number;
    scopeFilters?: DashboardScopeFilters;
  },
): Promise<DashboardRecentOccurrenceItem[]> {
  if (!canAccessOccurrenceMetrics(access)) {
    return [];
  }

  const limit = options?.limit ?? DASHBOARD_RECENT_OCCURRENCES_LIMIT;
  const scopeFilters = options?.scopeFilters;
  const fetchLimit = hasActiveDashboardScopeFilters(
    scopeFilters ?? { areaId: null, contractId: null, contractorOrganizationId: null },
  )
    ? limit * 5
    : limit;

  const supabase = createClient();

  const { data, error } = await supabase
    .from("occurrences")
    .select(
      `
        id,
        public_code,
        title,
        status,
        severity,
        created_at,
        area_id,
        contract_id,
        contractor_organization_id,
        areas ( name )
      `,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (error) {
    throw new Error("Não foi possível carregar ocorrências recentes.");
  }

  const mapped = ((data ?? []) as RecentOccurrenceRow[])
    .map((row) => {
      const area = normalizeJoin(row.areas);

      return {
        id: row.id,
        publicCode: row.public_code,
        title: row.title,
        status: row.status,
        severity: row.severity,
        createdAt: row.created_at,
        areaName: area?.name ?? null,
        scopeRow: {
          areaId: row.area_id,
          contractId: row.contract_id,
          contractorOrganizationId: row.contractor_organization_id,
        },
      };
    })
    .filter((row) =>
      scopeFilters && hasActiveDashboardScopeFilters(scopeFilters)
        ? matchesDashboardScopeFilters(row.scopeRow, scopeFilters)
        : true,
    )
    .slice(0, limit);

  return mapped.map(({ scopeRow: _scopeRow, ...item }) => item);
}

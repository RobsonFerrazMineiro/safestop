"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardPeriodFilter } from "@safestop/types";
import { DASHBOARD_STALE_TIME_MS } from "@safestop/types";

import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import { createClient } from "@/lib/auth/client";

import { dashboardKeys } from "../queries/dashboard-keys";
import type { DashboardScopeFilters } from "../types/scope-filters";

export type VolumeBucket = {
  label: string;
  count: number;
};

function bucketOccurrencesByDay(
  rows: readonly { created_at: string }[],
  period: DashboardPeriodFilter,
): VolumeBucket[] {
  const start = new Date(period.startAt).getTime();
  const end = new Date(period.endAt).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const buckets = new Map<string, number>();

  for (let time = start; time <= end; time += dayMs) {
    const key = new Date(time).toLocaleDateString("pt-BR");
    buckets.set(key, 0);
  }

  for (const row of rows) {
    const created = new Date(row.created_at).getTime();

    if (created < start || created > end) {
      continue;
    }

    const key = new Date(row.created_at).toLocaleDateString("pt-BR");
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return [...buckets.entries()].map(([label, count]) => ({ label, count }));
}

async function fetchVolumeBuckets(
  organizationId: string,
  period: DashboardPeriodFilter,
  scopeFilters: DashboardScopeFilters,
): Promise<VolumeBucket[]> {
  const supabase = createClient();

  let query = supabase
    .from("occurrences")
    .select("created_at, area_id, contract_id, contractor_organization_id")
    .eq("organization_id", organizationId)
    .gte("created_at", period.startAt)
    .lte("created_at", period.endAt);

  if (scopeFilters.areaId) {
    query = query.eq("area_id", scopeFilters.areaId);
  }

  if (scopeFilters.contractId) {
    query = query.eq("contract_id", scopeFilters.contractId);
  }

  if (scopeFilters.contractorOrganizationId) {
    query = query.eq("contractor_organization_id", scopeFilters.contractorOrganizationId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Não foi possível carregar o gráfico de volume.");
  }

  return bucketOccurrencesByDay(data ?? [], period);
}

export function useDashboardVolumeChart(
  period: DashboardPeriodFilter | null,
  enabled: boolean,
  scopeFilters: DashboardScopeFilters,
) {
  const { activeOrganization } = useActiveOrganization();
  const organizationId = activeOrganization?.id ?? "";

  const query = useQuery({
    queryKey: [...dashboardKeys.all(organizationId), "volume", period, scopeFilters] as const,
    queryFn: () => fetchVolumeBuckets(organizationId, period!, scopeFilters),
    enabled: enabled && organizationId.length > 0 && period !== null,
    staleTime: DASHBOARD_STALE_TIME_MS,
  });

  return {
    buckets: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

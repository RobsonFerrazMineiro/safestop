import {
  aggregateOccurrencesByStatusFamily,
  DASHBOARD_OCCURRENCE_STATUS_FAMILIES,
  DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS,
  isOccurrenceStatus,
  type OccurrenceStatus,
} from "@safestop/types";

import type { DashboardScopeOccurrenceRow } from "../types/scope-filters";
import type { DashboardScopeFilters } from "../types/scope-filters";
import { filterByDashboardScope } from "./matches-scope-filters";

export function computeScopedDistributionFromOccurrences(
  rows: DashboardScopeOccurrenceRow[],
  scopeFilters: DashboardScopeFilters,
) {
  const filtered = filterByDashboardScope(rows, scopeFilters).filter(
    (row): row is DashboardScopeOccurrenceRow & { status: OccurrenceStatus } =>
      isOccurrenceStatus(row.status),
  );

  const byStatusFamily = aggregateOccurrencesByStatusFamily(
    filtered.map((row) => ({ status: row.status })),
  );

  const statusFamilyBuckets = DASHBOARD_OCCURRENCE_STATUS_FAMILIES.map((family) => ({
    label: DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS[family],
    count: byStatusFamily[family] ?? 0,
  }));

  const areaCounts = new Map<string, { label: string; count: number }>();
  const contractorCounts = new Map<string, { label: string; count: number }>();

  for (const row of filtered) {
    const areaKey = row.areaId;
    const areaLabel = row.areaName ?? "Área sem nome";
    const existingArea = areaCounts.get(areaKey);
    areaCounts.set(areaKey, {
      label: areaLabel,
      count: (existingArea?.count ?? 0) + 1,
    });

    if (row.contractorOrganizationId) {
      const contractorKey = row.contractorOrganizationId;
      const contractorLabel = row.contractorOrganizationName ?? "Contratada sem nome";
      const existingContractor = contractorCounts.get(contractorKey);
      contractorCounts.set(contractorKey, {
        label: contractorLabel,
        count: (existingContractor?.count ?? 0) + 1,
      });
    }
  }

  return {
    statusFamilyBuckets,
    areaBuckets: [...areaCounts.values()].slice(0, 8),
    contractorBuckets: [...contractorCounts.values()].slice(0, 8),
  };
}

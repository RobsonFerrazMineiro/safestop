import type { DashboardScopeFilters, DashboardScopeOccurrenceRow } from "../types/scope-filters";

export function matchesDashboardScopeFilters(
  row: Pick<DashboardScopeOccurrenceRow, "areaId" | "contractId" | "contractorOrganizationId">,
  filters: DashboardScopeFilters,
): boolean {
  if (filters.areaId && row.areaId !== filters.areaId) {
    return false;
  }

  if (filters.contractId && row.contractId !== filters.contractId) {
    return false;
  }

  if (
    filters.contractorOrganizationId &&
    row.contractorOrganizationId !== filters.contractorOrganizationId
  ) {
    return false;
  }

  return true;
}

export function filterByDashboardScope<T extends DashboardScopeOccurrenceRow>(
  rows: T[],
  filters: DashboardScopeFilters,
): T[] {
  if (!filters.areaId && !filters.contractId && !filters.contractorOrganizationId) {
    return rows;
  }

  return rows.filter((row) => matchesDashboardScopeFilters(row, filters));
}

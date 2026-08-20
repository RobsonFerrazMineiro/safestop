/** Filtros locais de escopo (UI spec §6.2) — client-side até RPC dedicada. */
export type DashboardScopeFilters = {
  areaId: string | null;
  contractId: string | null;
  contractorOrganizationId: string | null;
};

export const EMPTY_DASHBOARD_SCOPE_FILTERS: DashboardScopeFilters = {
  areaId: null,
  contractId: null,
  contractorOrganizationId: null,
};

export function hasActiveDashboardScopeFilters(filters: DashboardScopeFilters): boolean {
  return Boolean(filters.areaId || filters.contractId || filters.contractorOrganizationId);
}

export type DashboardScopeOccurrenceRow = {
  id: string;
  status: string;
  areaId: string;
  areaName: string | null;
  contractId: string | null;
  contractorOrganizationId: string | null;
  contractorOrganizationName: string | null;
  createdAt: string;
};

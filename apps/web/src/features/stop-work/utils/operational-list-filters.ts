import type {
  OccurrenceListFilters,
  OccurrenceSeverity,
  OccurrenceStatus,
  OperationalOccurrenceListCursor,
} from "@safestop/types";
import { OPERATIONAL_OCCURRENCE_LIST_DEFAULT_LIMIT } from "@safestop/types";

export const OPERATIONAL_LIST_SEARCH_PLACEHOLDER = "Buscar por área, empresa, atividade…";
export const OPERATIONAL_LIST_SEARCH_DEBOUNCE_MS = 300;

export type OperationalListFunnelState = {
  status: OccurrenceStatus[];
  severity: OccurrenceSeverity | null;
  areaId: string | null;
  contractorOrganizationId: string | null;
};

export type OperationalListUiState = OperationalListFunnelState & {
  search: string;
};

export const EMPTY_OPERATIONAL_FUNNEL: OperationalListFunnelState = {
  status: [],
  severity: null,
  areaId: null,
  contractorOrganizationId: null,
};

export const EMPTY_OPERATIONAL_LIST_UI: OperationalListUiState = {
  ...EMPTY_OPERATIONAL_FUNNEL,
  search: "",
};

export function countActiveOperationalFunnelFilters(funnel: OperationalListFunnelState): number {
  let count = 0;

  if (funnel.status.length > 0) {
    count += 1;
  }

  if (funnel.severity !== null) {
    count += 1;
  }

  if (funnel.areaId !== null && funnel.areaId.length > 0) {
    count += 1;
  }

  if (funnel.contractorOrganizationId !== null && funnel.contractorOrganizationId.length > 0) {
    count += 1;
  }

  return count;
}

export function hasActiveOperationalDiscovery(state: OperationalListUiState): boolean {
  return state.search.trim().length > 0 || countActiveOperationalFunnelFilters(state) > 0;
}

/**
 * UI operacional → OccurrenceListFilters da RPC D1.
 * Não envia `imsReferenceCode` (sem filtro dedicado IMS nesta superfície).
 * Cursor ausente/null = primeira página (troca de search/funil reinicia a paginação).
 */
export function toOperationalOccurrenceListFilters(
  state: OperationalListUiState,
  cursor: OperationalOccurrenceListCursor | null = null,
): OccurrenceListFilters {
  const filters: OccurrenceListFilters = {
    pagination: {
      cursor,
      limit: OPERATIONAL_OCCURRENCE_LIST_DEFAULT_LIMIT,
    },
  };

  const search = state.search.trim();

  if (search.length > 0) {
    filters.search = search;
  }

  if (state.status.length > 0) {
    filters.status = [...state.status];
  }

  if (state.severity !== null) {
    filters.severity = state.severity;
  }

  if (state.areaId !== null && state.areaId.length > 0) {
    filters.areaId = state.areaId;
  }

  if (state.contractorOrganizationId !== null && state.contractorOrganizationId.length > 0) {
    filters.contractorOrganizationId = state.contractorOrganizationId;
  }

  return filters;
}

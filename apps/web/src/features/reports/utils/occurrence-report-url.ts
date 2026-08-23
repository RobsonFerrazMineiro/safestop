import type {
  OccurrenceReportFilters,
  OccurrenceReportSort,
  OccurrenceReportSortField,
  OccurrenceSeverity,
  OccurrenceStatus,
} from "@safestop/types";
import {
  isOccurrenceReportSortField,
  isOccurrenceSeverity,
  isOccurrenceStatus,
  OCCURRENCE_SEVERITIES,
  OCCURRENCE_STATUSES,
} from "@safestop/types";

import type { DashboardPeriodPresetId } from "@/features/dashboard/components/utils/period-presets";
import {
  DASHBOARD_DEFAULT_PERIOD_PRESET,
  resolveDashboardPeriodPreset,
} from "@/features/dashboard/components/utils/period-presets";

import {
  buildSearchParamsString,
  readBooleanFlag,
  readCsvParam,
  readOptionalUuid,
  readPeriodPreset,
  readSortDirection,
  writeBooleanFlag,
  writeCsvParam,
  writeOptionalUuid,
  writePeriodPreset,
  writeSort,
} from "./report-url-helpers";

export type OccurrenceReportViewState = {
  periodPreset: DashboardPeriodPresetId;
  areaId: string | null;
  contractId: string | null;
  contractorOrganizationId: string | null;
  status: OccurrenceStatus[];
  severity: OccurrenceSeverity[];
  hasIms: boolean | null;
  search: string | null;
  sortField: OccurrenceReportSortField;
  sortDirection: "asc" | "desc";
  showOptionalColumns: boolean;
};

export const OCCURRENCE_REPORT_DEFAULT_SORT: OccurrenceReportSort = {
  field: "occurred_at",
  direction: "desc",
};

export function parseOccurrenceReportViewState(
  searchParams: URLSearchParams,
): OccurrenceReportViewState {
  const status = readCsvParam(searchParams, "status").filter(isOccurrenceStatus);
  const severity = readCsvParam(searchParams, "severity").filter(isOccurrenceSeverity);
  const hasImsRaw = searchParams.get("hasIms")?.trim();
  const sortRaw = searchParams.get("sort")?.trim();
  const searchRaw = searchParams.get("search")?.trim();

  let hasIms: boolean | null = null;

  if (hasImsRaw === "true") {
    hasIms = true;
  } else if (hasImsRaw === "false") {
    hasIms = false;
  }

  return {
    periodPreset: readPeriodPreset(searchParams),
    areaId: readOptionalUuid(searchParams, "area"),
    contractId: readOptionalUuid(searchParams, "contract"),
    contractorOrganizationId: readOptionalUuid(searchParams, "contractor"),
    status,
    severity,
    hasIms,
    search: searchRaw && searchRaw.length > 0 ? searchRaw : null,
    sortField:
      sortRaw && isOccurrenceReportSortField(sortRaw)
        ? sortRaw
        : OCCURRENCE_REPORT_DEFAULT_SORT.field,
    sortDirection: readSortDirection(searchParams, OCCURRENCE_REPORT_DEFAULT_SORT.direction),
    showOptionalColumns: readBooleanFlag(searchParams, "optionalCols"),
  };
}

export function occurrenceViewStateToFilters(
  state: OccurrenceReportViewState,
): OccurrenceReportFilters {
  return {
    period: resolveDashboardPeriodPreset(state.periodPreset),
    areaId: state.areaId,
    contractId: state.contractId,
    contractorOrganizationId: state.contractorOrganizationId,
    status: state.status.length > 0 ? state.status : undefined,
    severity: state.severity.length > 0 ? state.severity : undefined,
    hasIms: state.hasIms,
    search: state.search,
  };
}

export function occurrenceViewStateToSort(state: OccurrenceReportViewState): OccurrenceReportSort {
  return {
    field: state.sortField,
    direction: state.sortDirection,
  };
}

export function hasActiveOccurrenceReportFilters(state: OccurrenceReportViewState): boolean {
  return (
    state.areaId !== null ||
    state.contractId !== null ||
    state.contractorOrganizationId !== null ||
    state.status.length > 0 ||
    state.severity.length > 0 ||
    state.hasIms !== null ||
    (state.search !== null && state.search.length > 0)
  );
}

export function serializeOccurrenceReportViewState(state: OccurrenceReportViewState): string {
  const params = new URLSearchParams();

  writePeriodPreset(params, state.periodPreset);
  writeOptionalUuid(params, "area", state.areaId);
  writeOptionalUuid(params, "contract", state.contractId);
  writeOptionalUuid(params, "contractor", state.contractorOrganizationId);
  writeCsvParam(params, "status", state.status);
  writeCsvParam(params, "severity", state.severity);

  if (state.hasIms === true) {
    params.set("hasIms", "true");
  } else if (state.hasIms === false) {
    params.set("hasIms", "false");
  }

  if (state.search) {
    params.set("search", state.search);
  }

  writeSort(
    params,
    state.sortField,
    state.sortDirection,
    OCCURRENCE_REPORT_DEFAULT_SORT.field,
    OCCURRENCE_REPORT_DEFAULT_SORT.direction,
  );
  writeBooleanFlag(params, "optionalCols", state.showOptionalColumns);

  return buildSearchParamsString(params);
}

export function emptyOccurrenceReportViewState(): OccurrenceReportViewState {
  return {
    periodPreset: DASHBOARD_DEFAULT_PERIOD_PRESET,
    areaId: null,
    contractId: null,
    contractorOrganizationId: null,
    status: [],
    severity: [],
    hasIms: null,
    search: null,
    sortField: OCCURRENCE_REPORT_DEFAULT_SORT.field,
    sortDirection: OCCURRENCE_REPORT_DEFAULT_SORT.direction,
    showOptionalColumns: false,
  };
}

export const OCCURRENCE_STATUS_OPTIONS = OCCURRENCE_STATUSES.map((status) => status);
export const OCCURRENCE_SEVERITY_OPTIONS = OCCURRENCE_SEVERITIES.map((severity) => severity);

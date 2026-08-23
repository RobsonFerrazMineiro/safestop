import type {
  AwarenessReportFilters,
  AwarenessReportSort,
  AwarenessReportSortField,
} from "@safestop/types";
import { isAwarenessReportSortField } from "@safestop/types";

import type { DashboardPeriodPresetId } from "@/features/dashboard/components/utils/period-presets";
import {
  DASHBOARD_DEFAULT_PERIOD_PRESET,
  resolveDashboardPeriodPreset,
} from "@/features/dashboard/components/utils/period-presets";

import {
  buildSearchParamsString,
  readBooleanFlag,
  readOptionalUuid,
  readPeriodPreset,
  readSortDirection,
  writeBooleanFlag,
  writeOptionalUuid,
  writePeriodPreset,
  writeSort,
} from "./report-url-helpers";

export type AwarenessReportViewState = {
  periodPreset: DashboardPeriodPresetId;
  recipientMemberId: string | null;
  pendingOnly: boolean;
  sortField: AwarenessReportSortField;
  sortDirection: "asc" | "desc";
  showOptionalColumns: boolean;
};

export const AWARENESS_REPORT_DEFAULT_SORT: AwarenessReportSort = {
  field: "created_at",
  direction: "desc",
};

export function parseAwarenessReportViewState(
  searchParams: URLSearchParams,
): AwarenessReportViewState {
  const sortRaw = searchParams.get("sort")?.trim();

  return {
    periodPreset: readPeriodPreset(searchParams),
    recipientMemberId: readOptionalUuid(searchParams, "recipient"),
    pendingOnly: readBooleanFlag(searchParams, "pending"),
    sortField:
      sortRaw && isAwarenessReportSortField(sortRaw)
        ? sortRaw
        : AWARENESS_REPORT_DEFAULT_SORT.field,
    sortDirection: readSortDirection(searchParams, AWARENESS_REPORT_DEFAULT_SORT.direction),
    showOptionalColumns: readBooleanFlag(searchParams, "optionalCols"),
  };
}

export function awarenessViewStateToFilters(
  state: AwarenessReportViewState,
): AwarenessReportFilters {
  return {
    period: resolveDashboardPeriodPreset(state.periodPreset),
    recipientMemberId: state.recipientMemberId,
    pendingOnly: state.pendingOnly ? true : null,
  };
}

export function awarenessViewStateToSort(state: AwarenessReportViewState): AwarenessReportSort {
  return {
    field: state.sortField,
    direction: state.sortDirection,
  };
}

export function hasActiveAwarenessReportFilters(state: AwarenessReportViewState): boolean {
  return state.recipientMemberId !== null || state.pendingOnly;
}

export function serializeAwarenessReportViewState(state: AwarenessReportViewState): string {
  const params = new URLSearchParams();

  writePeriodPreset(params, state.periodPreset);
  writeOptionalUuid(params, "recipient", state.recipientMemberId);
  writeBooleanFlag(params, "pending", state.pendingOnly);
  writeSort(
    params,
    state.sortField,
    state.sortDirection,
    AWARENESS_REPORT_DEFAULT_SORT.field,
    AWARENESS_REPORT_DEFAULT_SORT.direction,
  );
  writeBooleanFlag(params, "optionalCols", state.showOptionalColumns);

  return buildSearchParamsString(params);
}

export function emptyAwarenessReportViewState(): AwarenessReportViewState {
  return {
    periodPreset: DASHBOARD_DEFAULT_PERIOD_PRESET,
    recipientMemberId: null,
    pendingOnly: false,
    sortField: AWARENESS_REPORT_DEFAULT_SORT.field,
    sortDirection: AWARENESS_REPORT_DEFAULT_SORT.direction,
    showOptionalColumns: false,
  };
}

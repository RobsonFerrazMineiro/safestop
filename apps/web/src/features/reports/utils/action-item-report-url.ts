import type {
  ActionItemReportFilters,
  ActionItemReportSort,
  ActionItemReportSortField,
  ActionItemStatus,
} from "@safestop/types";
import {
  ACTION_ITEM_STATUSES,
  DASHBOARD_DUE_SOON_DAYS_DEFAULT,
  isActionItemReportSortField,
  isActionItemStatus,
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

export type ActionItemReportViewState = {
  periodPreset: DashboardPeriodPresetId;
  responsibleMemberId: string | null;
  status: ActionItemStatus[];
  overdueOnly: boolean;
  dueSoonOnly: boolean;
  dueSoonDays: number;
  sortField: ActionItemReportSortField;
  sortDirection: "asc" | "desc";
  showOptionalColumns: boolean;
};

export const ACTION_ITEM_REPORT_DEFAULT_SORT: ActionItemReportSort = {
  field: "due_at",
  direction: "asc",
};

export function parseActionItemReportViewState(
  searchParams: URLSearchParams,
): ActionItemReportViewState {
  const status = readCsvParam(searchParams, "status").filter(isActionItemStatus);
  const sortRaw = searchParams.get("sort")?.trim();
  const dueSoonDaysRaw = Number.parseInt(searchParams.get("dueSoonDays") ?? "", 10);

  return {
    periodPreset: readPeriodPreset(searchParams),
    responsibleMemberId: readOptionalUuid(searchParams, "responsible"),
    status,
    overdueOnly: readBooleanFlag(searchParams, "overdue"),
    dueSoonOnly: readBooleanFlag(searchParams, "dueSoon"),
    dueSoonDays:
      Number.isFinite(dueSoonDaysRaw) && dueSoonDaysRaw >= 1 && dueSoonDaysRaw <= 30
        ? dueSoonDaysRaw
        : DASHBOARD_DUE_SOON_DAYS_DEFAULT,
    sortField:
      sortRaw && isActionItemReportSortField(sortRaw)
        ? sortRaw
        : ACTION_ITEM_REPORT_DEFAULT_SORT.field,
    sortDirection: readSortDirection(searchParams, ACTION_ITEM_REPORT_DEFAULT_SORT.direction),
    showOptionalColumns: readBooleanFlag(searchParams, "optionalCols"),
  };
}

export function actionItemViewStateToFilters(
  state: ActionItemReportViewState,
): ActionItemReportFilters {
  return {
    period: resolveDashboardPeriodPreset(state.periodPreset),
    responsibleMemberId: state.responsibleMemberId,
    status: state.status.length > 0 ? state.status : undefined,
    overdueOnly: state.overdueOnly ? true : null,
    dueSoonOnly: state.dueSoonOnly ? true : null,
    dueSoonDays: state.dueSoonDays,
  };
}

export function actionItemViewStateToSort(state: ActionItemReportViewState): ActionItemReportSort {
  return {
    field: state.sortField,
    direction: state.sortDirection,
  };
}

export function hasActiveActionItemReportFilters(state: ActionItemReportViewState): boolean {
  return (
    state.responsibleMemberId !== null ||
    state.status.length > 0 ||
    state.overdueOnly ||
    state.dueSoonOnly
  );
}

export function serializeActionItemReportViewState(state: ActionItemReportViewState): string {
  const params = new URLSearchParams();

  writePeriodPreset(params, state.periodPreset);
  writeOptionalUuid(params, "responsible", state.responsibleMemberId);
  writeCsvParam(params, "status", state.status);
  writeBooleanFlag(params, "overdue", state.overdueOnly);
  writeBooleanFlag(params, "dueSoon", state.dueSoonOnly);

  if (state.dueSoonDays !== DASHBOARD_DUE_SOON_DAYS_DEFAULT) {
    params.set("dueSoonDays", String(state.dueSoonDays));
  }

  writeSort(
    params,
    state.sortField,
    state.sortDirection,
    ACTION_ITEM_REPORT_DEFAULT_SORT.field,
    ACTION_ITEM_REPORT_DEFAULT_SORT.direction,
  );
  writeBooleanFlag(params, "optionalCols", state.showOptionalColumns);

  return buildSearchParamsString(params);
}

export function emptyActionItemReportViewState(): ActionItemReportViewState {
  return {
    periodPreset: DASHBOARD_DEFAULT_PERIOD_PRESET,
    responsibleMemberId: null,
    status: [],
    overdueOnly: false,
    dueSoonOnly: false,
    dueSoonDays: DASHBOARD_DUE_SOON_DAYS_DEFAULT,
    sortField: ACTION_ITEM_REPORT_DEFAULT_SORT.field,
    sortDirection: ACTION_ITEM_REPORT_DEFAULT_SORT.direction,
    showOptionalColumns: false,
  };
}

export const ACTION_ITEM_STATUS_OPTIONS = ACTION_ITEM_STATUSES.map((status) => status);

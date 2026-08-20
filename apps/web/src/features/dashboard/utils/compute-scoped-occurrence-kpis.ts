import type { DashboardKpis, DashboardPeriodFilter, OccurrenceStatus } from "@safestop/types";
import {
  isActiveInterdictionOccurrence,
  isActiveOccurrence,
  isAwaitingValidationOccurrence,
  isOccurrenceStatus,
  isPendingEvaluationOccurrence,
  isWithinPeriod,
} from "@safestop/types";

import type { DashboardScopeOccurrenceRow } from "../types/scope-filters";

export function computeScopedManagerialOccurrenceKpis(
  rows: DashboardScopeOccurrenceRow[],
  period: DashboardPeriodFilter | null,
): Pick<
  DashboardKpis["managerial"],
  | "activeOccurrences"
  | "pendingEvaluation"
  | "activeInterdictions"
  | "awaitingValidation"
  | "newOccurrencesInPeriod"
> {
  const statusRows = rows.filter(
    (row): row is DashboardScopeOccurrenceRow & { status: OccurrenceStatus } =>
      isOccurrenceStatus(row.status),
  );

  return {
    activeOccurrences: statusRows.filter((row) => isActiveOccurrence(row.status)).length,
    pendingEvaluation: statusRows.filter((row) => isPendingEvaluationOccurrence(row.status)).length,
    activeInterdictions: statusRows.filter((row) => isActiveInterdictionOccurrence(row.status))
      .length,
    awaitingValidation: statusRows.filter((row) => isAwaitingValidationOccurrence(row.status))
      .length,
    newOccurrencesInPeriod:
      period === null
        ? null
        : statusRows.filter((row) => isWithinPeriod(row.createdAt, period)).length,
  };
}

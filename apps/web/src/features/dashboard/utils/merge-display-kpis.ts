import type {
  DashboardActionItemsAttention,
  DashboardKpis,
  DashboardPeriodFilter,
} from "@safestop/types";

import type { DashboardScopeOccurrenceRow } from "../types/scope-filters";
import { hasActiveDashboardScopeFilters, type DashboardScopeFilters } from "../types/scope-filters";
import { computeScopedManagerialOccurrenceKpis } from "./compute-scoped-occurrence-kpis";
import { filterByDashboardScope } from "./matches-scope-filters";

/** Alinha card de ações vencidas/próximas com a lista (mesma fonte getActionItemsAttention). */
export function mergeAttentionIntoKpis(
  kpis: DashboardKpis,
  attention: DashboardActionItemsAttention | undefined,
  attentionEnabled: boolean,
): DashboardKpis {
  if (!attentionEnabled || !attention) {
    return kpis;
  }

  return {
    ...kpis,
    managerial: {
      ...kpis.managerial,
      overdueActionItems: attention.overdueCount ?? kpis.managerial.overdueActionItems,
      dueSoonActionItems: attention.dueSoonCount ?? kpis.managerial.dueSoonActionItems,
    },
  };
}

export function mergeScopeFiltersIntoKpis(
  kpis: DashboardKpis,
  scopeOccurrences: DashboardScopeOccurrenceRow[],
  scopeFilters: DashboardScopeFilters,
  period: DashboardPeriodFilter | null,
): DashboardKpis {
  if (!hasActiveDashboardScopeFilters(scopeFilters)) {
    return kpis;
  }

  const filtered = filterByDashboardScope(scopeOccurrences, scopeFilters);
  const scoped = computeScopedManagerialOccurrenceKpis(filtered, period);

  return {
    ...kpis,
    managerial: {
      ...kpis.managerial,
      activeOccurrences: scoped.activeOccurrences,
      pendingEvaluation: scoped.pendingEvaluation,
      activeInterdictions: scoped.activeInterdictions,
      awaitingValidation: scoped.awaitingValidation,
      newOccurrencesInPeriod: scoped.newOccurrencesInPeriod,
    },
  };
}

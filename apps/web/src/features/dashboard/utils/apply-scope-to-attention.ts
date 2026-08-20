import type { DashboardActionItemsAttention } from "@safestop/types";

import type { DashboardScopeFilters } from "../types/scope-filters";
import { hasActiveDashboardScopeFilters } from "../types/scope-filters";
import type { DashboardScopeOccurrenceRow } from "../types/scope-filters";
import { matchesDashboardScopeFilters } from "./matches-scope-filters";

function filterAttentionItemsByScope(
  items: DashboardActionItemsAttention["overdueItems"],
  scopeOccurrences: DashboardScopeOccurrenceRow[],
  scopeFilters: DashboardScopeFilters,
) {
  const scopeByOccurrenceId = new Map(scopeOccurrences.map((row) => [row.id, row]));

  return items.filter((item) => {
    if (!item.occurrenceId) {
      return false;
    }

    const occurrence = scopeByOccurrenceId.get(item.occurrenceId);

    if (!occurrence) {
      return false;
    }

    return matchesDashboardScopeFilters(occurrence, scopeFilters);
  });
}

export function applyScopeFiltersToAttention(
  attention: DashboardActionItemsAttention | undefined,
  scopeOccurrences: DashboardScopeOccurrenceRow[],
  scopeFilters: DashboardScopeFilters,
): DashboardActionItemsAttention | undefined {
  if (!attention || !hasActiveDashboardScopeFilters(scopeFilters)) {
    return attention;
  }

  const overdueItems = filterAttentionItemsByScope(
    attention.overdueItems,
    scopeOccurrences,
    scopeFilters,
  );
  const dueSoonItems = filterAttentionItemsByScope(
    attention.dueSoonItems,
    scopeOccurrences,
    scopeFilters,
  );

  return {
    overdueCount: overdueItems.length,
    dueSoonCount: dueSoonItems.length,
    overdueItems,
    dueSoonItems,
  };
}

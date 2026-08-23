import type {
  ActionItemReportFilters,
  ActionItemReportSort,
  ListActionItemsReportResult,
  ReportPagination,
} from "@safestop/types";
import {
  buildListActionItemsReportRpcArgs,
  ReportRpcError,
  isReportRpcUnavailableError,
  mapListActionItemsReportResult,
  parseReportRpcErrorCode,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

/**
 * Relatório de Plano de Ação (Sprint 3.3). SECURITY INVOKER — RLS de
 * `action_items` (occurrence.read + can_access_occurrence via action_plans)
 * já cobre o escopo. isOverdue/isDueSoon vêm calculados pela RPC com a mesma
 * fórmula de dashboard-formulas.ts (paridade com Dashboard 3.2).
 */
export async function listActionItemsReport(
  organizationId: string,
  filters: ActionItemReportFilters = {},
  sort?: ActionItemReportSort,
  pagination: ReportPagination = {},
): Promise<ListActionItemsReportResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "list_action_items_report",
    buildListActionItemsReportRpcArgs(organizationId, filters, sort, pagination),
  );

  if (error) {
    if (isReportRpcUnavailableError(error)) {
      return { items: [], nextCursor: null, hasNext: false };
    }

    throw new ReportRpcError(parseReportRpcErrorCode(error));
  }

  return mapListActionItemsReportResult(data);
}

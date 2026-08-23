import type {
  AwarenessReportFilters,
  AwarenessReportSort,
  ListAwarenessReportResult,
  ReportPagination,
} from "@safestop/types";
import {
  buildListAwarenessReportRpcArgs,
  ReportRpcError,
  isReportRpcUnavailableError,
  mapListAwarenessReportResult,
  parseReportRpcErrorCode,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

/**
 * Relatório de Ciência (Sprint 3.3, PO-REP-4). SECURITY DEFINER — gate
 * has_permission('report.read') é a primeira linha executada na RPC; sem
 * ele, nenhuma linha é retornada, mesmo com occurrence.read amplo (achado
 * técnico igual a pendingAwarenessOrg em get_dashboard_kpis).
 */
export async function listAwarenessReport(
  organizationId: string,
  filters: AwarenessReportFilters = {},
  sort?: AwarenessReportSort,
  pagination: ReportPagination = {},
): Promise<ListAwarenessReportResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "list_awareness_report",
    buildListAwarenessReportRpcArgs(organizationId, filters, sort, pagination),
  );

  if (error) {
    if (isReportRpcUnavailableError(error)) {
      return { items: [], nextCursor: null, hasNext: false };
    }

    throw new ReportRpcError(parseReportRpcErrorCode(error));
  }

  return mapListAwarenessReportResult(data);
}

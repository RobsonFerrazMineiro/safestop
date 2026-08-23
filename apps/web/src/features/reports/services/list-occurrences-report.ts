import type {
  ListOccurrencesReportResult,
  OccurrenceReportFilters,
  OccurrenceReportSort,
  ReportPagination,
} from "@safestop/types";
import {
  buildListOccurrencesReportRpcArgs,
  ReportRpcError,
  isReportRpcUnavailableError,
  mapListOccurrencesReportResult,
  parseReportRpcErrorCode,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

/**
 * Relatório de Ocorrências (Sprint 3.3, PO-REP-3). SECURITY INVOKER — RLS de
 * `occurrences` (occurrence.read + can_access_occurrence) já cobre o escopo.
 * Nunca contorna RLS: retorna exatamente o que a RPC devolveria para o
 * usuário autenticado.
 */
export async function listOccurrencesReport(
  organizationId: string,
  filters: OccurrenceReportFilters = {},
  sort?: OccurrenceReportSort,
  pagination: ReportPagination = {},
): Promise<ListOccurrencesReportResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "list_occurrences_report",
    buildListOccurrencesReportRpcArgs(organizationId, filters, sort, pagination),
  );

  if (error) {
    if (isReportRpcUnavailableError(error)) {
      return { items: [], nextCursor: null, hasNext: false };
    }

    throw new ReportRpcError(parseReportRpcErrorCode(error));
  }

  return mapListOccurrencesReportResult(data);
}

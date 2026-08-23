import type { OccurrenceReportFilters, OccurrenceReportSort } from "@safestop/types";

import { listOccurrencesReport } from "./list-occurrences-report";
import { logReportExport } from "./log-report-export";
import {
  OCCURRENCE_REPORT_CSV_HEADERS,
  occurrenceReportRowToCsvCells,
} from "./utils/occurrence-report-columns";
import { buildCsvBlob } from "./utils/csv";
import { fetchAllReportRows } from "./utils/fetch-all-report-rows";
import { buildReportFileName } from "./utils/report-file-name";
import type { ReportExportResult } from "./utils/report-export-result";
import { toJsonRecord } from "./utils/to-json-record";

/**
 * Exporta o Relatório de Ocorrências completo (todas as páginas, não só a
 * página atual) em CSV. Chama `log_report_export` imediatamente após montar
 * o arquivo com sucesso — falha na auditoria não bloqueia o retorno do
 * arquivo já gerado (ver log-report-export.ts).
 */
export async function exportOccurrencesReportCsv(
  organizationId: string,
  filters: OccurrenceReportFilters = {},
  sort?: OccurrenceReportSort,
): Promise<ReportExportResult> {
  const rows = await fetchAllReportRows((pagination) =>
    listOccurrencesReport(organizationId, filters, sort, pagination),
  );

  const blob = buildCsvBlob(OCCURRENCE_REPORT_CSV_HEADERS, rows.map(occurrenceReportRowToCsvCells));

  const auditResult = await logReportExport({
    organizationId,
    reportType: "OCCURRENCES",
    exportFormat: "CSV",
    filters: toJsonRecord(filters),
    rowCount: rows.length,
  });

  if (!auditResult.ok) {
    console.error(
      "[reports] Falha ao registrar auditoria de exportação (OCCURRENCES/CSV):",
      auditResult.error,
    );
  }

  return {
    blob,
    fileName: buildReportFileName("relatorio-ocorrencias", "csv"),
    rowCount: rows.length,
  };
}

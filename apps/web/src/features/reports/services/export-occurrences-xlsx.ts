import type { OccurrenceReportFilters, OccurrenceReportSort } from "@safestop/types";

import { listOccurrencesReport } from "./list-occurrences-report";
import { logReportExport } from "./log-report-export";
import { OCCURRENCE_REPORT_XLSX_COLUMNS } from "./utils/occurrence-report-columns";
import { fetchAllReportRows } from "./utils/fetch-all-report-rows";
import { buildReportFileName } from "./utils/report-file-name";
import type { ReportExportResult } from "./utils/report-export-result";
import { toJsonRecord } from "./utils/to-json-record";
import { buildXlsxBlob } from "./utils/xlsx";

/**
 * Exporta o Relatório de Ocorrências completo em XLSX (biblioteca
 * `write-excel-file` — justificativa em utils/xlsx.ts). Mesma regra de
 * auditoria não bloqueante de export-occurrences-csv.ts.
 */
export async function exportOccurrencesReportXlsx(
  organizationId: string,
  filters: OccurrenceReportFilters = {},
  sort?: OccurrenceReportSort,
): Promise<ReportExportResult> {
  const rows = await fetchAllReportRows((pagination) =>
    listOccurrencesReport(organizationId, filters, sort, pagination),
  );

  const blob = await buildXlsxBlob(rows, OCCURRENCE_REPORT_XLSX_COLUMNS);

  const auditResult = await logReportExport({
    organizationId,
    reportType: "OCCURRENCES",
    exportFormat: "XLSX",
    filters: toJsonRecord(filters),
    rowCount: rows.length,
  });

  if (!auditResult.ok) {
    console.error(
      "[reports] Falha ao registrar auditoria de exportação (OCCURRENCES/XLSX):",
      auditResult.error,
    );
  }

  return {
    blob,
    fileName: buildReportFileName("relatorio-ocorrencias", "xlsx"),
    rowCount: rows.length,
  };
}

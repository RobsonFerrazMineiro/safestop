import type { AwarenessReportFilters, AwarenessReportSort } from "@safestop/types";

import { listAwarenessReport } from "./list-awareness-report";
import { logReportExport } from "./log-report-export";
import { AWARENESS_REPORT_XLSX_COLUMNS } from "./utils/awareness-report-columns";
import { fetchAllReportRows } from "./utils/fetch-all-report-rows";
import { buildReportFileName } from "./utils/report-file-name";
import type { ReportExportResult } from "./utils/report-export-result";
import { toJsonRecord } from "./utils/to-json-record";
import { buildXlsxBlob } from "./utils/xlsx";

export async function exportAwarenessReportXlsx(
  organizationId: string,
  filters: AwarenessReportFilters = {},
  sort?: AwarenessReportSort,
): Promise<ReportExportResult> {
  const rows = await fetchAllReportRows((pagination) =>
    listAwarenessReport(organizationId, filters, sort, pagination),
  );

  const blob = await buildXlsxBlob(rows, AWARENESS_REPORT_XLSX_COLUMNS);

  const auditResult = await logReportExport({
    organizationId,
    reportType: "AWARENESS",
    exportFormat: "XLSX",
    filters: toJsonRecord(filters),
    rowCount: rows.length,
  });

  if (!auditResult.ok) {
    console.error(
      "[reports] Falha ao registrar auditoria de exportação (AWARENESS/XLSX):",
      auditResult.error,
    );
  }

  return {
    blob,
    fileName: buildReportFileName("relatorio-ciencia", "xlsx"),
    rowCount: rows.length,
  };
}

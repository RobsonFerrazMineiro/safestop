import type { AwarenessReportFilters, AwarenessReportSort } from "@safestop/types";

import { listAwarenessReport } from "./list-awareness-report";
import { logReportExport } from "./log-report-export";
import {
  AWARENESS_REPORT_CSV_HEADERS,
  awarenessReportRowToCsvCells,
} from "./utils/awareness-report-columns";
import { buildCsvBlob } from "./utils/csv";
import { fetchAllReportRows } from "./utils/fetch-all-report-rows";
import { buildReportFileName } from "./utils/report-file-name";
import type { ReportExportResult } from "./utils/report-export-result";
import { toJsonRecord } from "./utils/to-json-record";

export async function exportAwarenessReportCsv(
  organizationId: string,
  filters: AwarenessReportFilters = {},
  sort?: AwarenessReportSort,
): Promise<ReportExportResult> {
  const rows = await fetchAllReportRows((pagination) =>
    listAwarenessReport(organizationId, filters, sort, pagination),
  );

  const blob = buildCsvBlob(AWARENESS_REPORT_CSV_HEADERS, rows.map(awarenessReportRowToCsvCells));

  const auditResult = await logReportExport({
    organizationId,
    reportType: "AWARENESS",
    exportFormat: "CSV",
    filters: toJsonRecord(filters),
    rowCount: rows.length,
  });

  if (!auditResult.ok) {
    console.error(
      "[reports] Falha ao registrar auditoria de exportação (AWARENESS/CSV):",
      auditResult.error,
    );
  }

  return {
    blob,
    fileName: buildReportFileName("relatorio-ciencia", "csv"),
    rowCount: rows.length,
  };
}

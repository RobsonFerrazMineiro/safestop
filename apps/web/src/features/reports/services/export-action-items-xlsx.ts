import type { ActionItemReportFilters, ActionItemReportSort } from "@safestop/types";

import { listActionItemsReport } from "./list-action-items-report";
import { logReportExport } from "./log-report-export";
import { ACTION_ITEM_REPORT_XLSX_COLUMNS } from "./utils/action-item-report-columns";
import { fetchAllReportRows } from "./utils/fetch-all-report-rows";
import { buildReportFileName } from "./utils/report-file-name";
import type { ReportExportResult } from "./utils/report-export-result";
import { toJsonRecord } from "./utils/to-json-record";
import { buildXlsxBlob } from "./utils/xlsx";

export async function exportActionItemsReportXlsx(
  organizationId: string,
  filters: ActionItemReportFilters = {},
  sort?: ActionItemReportSort,
): Promise<ReportExportResult> {
  const rows = await fetchAllReportRows((pagination) =>
    listActionItemsReport(organizationId, filters, sort, pagination),
  );

  const blob = await buildXlsxBlob(rows, ACTION_ITEM_REPORT_XLSX_COLUMNS);

  const auditResult = await logReportExport({
    organizationId,
    reportType: "ACTION_ITEMS",
    exportFormat: "XLSX",
    filters: toJsonRecord(filters),
    rowCount: rows.length,
  });

  if (!auditResult.ok) {
    console.error(
      "[reports] Falha ao registrar auditoria de exportação (ACTION_ITEMS/XLSX):",
      auditResult.error,
    );
  }

  return {
    blob,
    fileName: buildReportFileName("relatorio-plano-de-acao", "xlsx"),
    rowCount: rows.length,
  };
}

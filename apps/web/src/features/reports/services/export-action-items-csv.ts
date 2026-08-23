import type { ActionItemReportFilters, ActionItemReportSort } from "@safestop/types";

import { listActionItemsReport } from "./list-action-items-report";
import { logReportExport } from "./log-report-export";
import {
  ACTION_ITEM_REPORT_CSV_HEADERS,
  actionItemReportRowToCsvCells,
} from "./utils/action-item-report-columns";
import { buildCsvBlob } from "./utils/csv";
import { fetchAllReportRows } from "./utils/fetch-all-report-rows";
import { buildReportFileName } from "./utils/report-file-name";
import type { ReportExportResult } from "./utils/report-export-result";
import { toJsonRecord } from "./utils/to-json-record";

export async function exportActionItemsReportCsv(
  organizationId: string,
  filters: ActionItemReportFilters = {},
  sort?: ActionItemReportSort,
): Promise<ReportExportResult> {
  const rows = await fetchAllReportRows((pagination) =>
    listActionItemsReport(organizationId, filters, sort, pagination),
  );

  const blob = buildCsvBlob(
    ACTION_ITEM_REPORT_CSV_HEADERS,
    rows.map(actionItemReportRowToCsvCells),
  );

  const auditResult = await logReportExport({
    organizationId,
    reportType: "ACTION_ITEMS",
    exportFormat: "CSV",
    filters: toJsonRecord(filters),
    rowCount: rows.length,
  });

  if (!auditResult.ok) {
    console.error(
      "[reports] Falha ao registrar auditoria de exportação (ACTION_ITEMS/CSV):",
      auditResult.error,
    );
  }

  return {
    blob,
    fileName: buildReportFileName("relatorio-plano-de-acao", "csv"),
    rowCount: rows.length,
  };
}

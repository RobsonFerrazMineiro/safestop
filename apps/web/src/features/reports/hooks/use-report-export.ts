"use client";

import { useCallback, useState } from "react";
import { ReportRpcError } from "@safestop/types";

import { ReportExportLimitExceededError } from "../services/utils/fetch-all-report-rows";
import type { ReportExportResult } from "../services/utils/report-export-result";
import { downloadReportBlob } from "../utils/download-report-blob";
import { REPORT_COPY } from "../utils/report-copy";

type ExportRunner = () => Promise<ReportExportResult>;

export function useReportExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const runExport = useCallback(async (runner: ExportRunner) => {
    setIsExporting(true);
    setExportError(null);

    try {
      const result = await runner();
      downloadReportBlob(result);
    } catch (error) {
      if (error instanceof ReportExportLimitExceededError) {
        setExportError(error.message);
      } else if (error instanceof ReportRpcError) {
        setExportError(error.message);
      } else {
        setExportError(REPORT_COPY.exportError);
      }
    } finally {
      setIsExporting(false);
    }
  }, []);

  const clearExportError = useCallback(() => {
    setExportError(null);
  }, []);

  return {
    isExporting,
    exportError,
    runExport,
    clearExportError,
  };
}

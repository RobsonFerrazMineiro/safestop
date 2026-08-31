"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { REPORT_COPY } from "../utils/report-copy";

type ReportExportMenuProps = {
  disabled?: boolean;
  isExporting: boolean;
  onExportCsv: () => void;
  onExportXlsx: () => void;
};

export function ReportExportMenu({
  disabled = false,
  isExporting,
  onExportCsv,
  onExportXlsx,
}: ReportExportMenuProps) {
  const isDisabled = disabled || isExporting;

  return (
    <div data-testid="report-export-menu">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid="report-export-trigger"
            disabled={isDisabled}
            type="button"
            variant="outline"
          >
            {isExporting ? (
              REPORT_COPY.exportLoading
            ) : (
              <>
                <Download />
                {REPORT_COPY.export}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            data-testid="report-export-csv"
            onSelect={() => {
              onExportCsv();
            }}
          >
            {REPORT_COPY.exportCsv}
          </DropdownMenuItem>
          <DropdownMenuItem
            data-testid="report-export-xlsx"
            onSelect={() => {
              onExportXlsx();
            }}
          >
            {REPORT_COPY.exportXlsx}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

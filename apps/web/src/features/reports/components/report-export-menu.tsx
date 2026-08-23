"use client";

import { useEffect, useRef, useState } from "react";

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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const isDisabled = disabled || isExporting;

  return (
    <div ref={containerRef} className="relative" data-testid="report-export-menu">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="report-export-trigger"
        disabled={isDisabled}
        type="button"
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        {isExporting ? REPORT_COPY.exportLoading : REPORT_COPY.export}
      </button>

      {open && !isDisabled ? (
        <div
          className="absolute right-0 z-20 mt-2 min-w-[10rem] rounded-md border border-gray-700 bg-gray-900 py-1 shadow-lg"
          role="menu"
        >
          <button
            className="block w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-800"
            data-testid="report-export-csv"
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onExportCsv();
            }}
          >
            {REPORT_COPY.exportCsv}
          </button>
          <button
            className="block w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-gray-800"
            data-testid="report-export-xlsx"
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              onExportXlsx();
            }}
          >
            {REPORT_COPY.exportXlsx}
          </button>
        </div>
      ) : null}
    </div>
  );
}

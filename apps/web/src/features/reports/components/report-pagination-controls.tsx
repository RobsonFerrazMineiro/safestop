"use client";

import { REPORT_COPY } from "../utils/report-copy";

type ReportPaginationControlsProps = {
  itemCount: number;
  hasNext: boolean;
  canGoPrevious: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function ReportPaginationControls({
  itemCount,
  hasNext,
  canGoPrevious,
  onPrevious,
  onNext,
}: ReportPaginationControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-gray-400">
        Mostrando {itemCount} · {hasNext ? REPORT_COPY.hasMore : REPORT_COPY.endOfResults}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canGoPrevious}
          type="button"
          onClick={onPrevious}
        >
          Anterior
        </button>
        <button
          className="rounded-md border border-gray-700 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasNext}
          type="button"
          onClick={onNext}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

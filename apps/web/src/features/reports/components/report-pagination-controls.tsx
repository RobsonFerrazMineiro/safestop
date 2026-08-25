"use client";

import { Button } from "@/components/ui/button";

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
      <p className="text-sm text-muted-foreground">
        Mostrando {itemCount} · {hasNext ? REPORT_COPY.hasMore : REPORT_COPY.endOfResults}
      </p>
      <div className="flex items-center gap-2">
        <Button disabled={!canGoPrevious} type="button" variant="outline" onClick={onPrevious}>
          Anterior
        </Button>
        <Button disabled={!hasNext} type="button" variant="outline" onClick={onNext}>
          Próxima
        </Button>
      </div>
    </div>
  );
}

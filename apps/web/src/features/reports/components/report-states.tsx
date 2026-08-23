"use client";

import { REPORT_COPY } from "../utils/report-copy";

export function ReportPageSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="min-h-[7rem] animate-pulse rounded-lg border border-gray-800 bg-gray-900/40"
          />
        ))}
      </div>
      <div className="h-12 animate-pulse rounded-lg border border-gray-800 bg-gray-900/40" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-lg border border-gray-800 bg-gray-900/40"
          />
        ))}
      </div>
    </div>
  );
}

type ReportErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ReportErrorState({ message, onRetry }: ReportErrorStateProps) {
  return (
    <div
      className="flex flex-col items-start gap-2 rounded-lg border border-red-900/40 bg-red-950/20 p-4"
      role="alert"
    >
      <p className="text-sm text-red-300">{message ?? REPORT_COPY.loadError}</p>
      {onRetry ? (
        <button
          className="text-sm text-orange-400 hover:text-orange-300"
          type="button"
          onClick={onRetry}
        >
          {REPORT_COPY.retry}
        </button>
      ) : null}
    </div>
  );
}

type ReportEmptyStateProps = {
  variant: "empty" | "no-results";
  onClearFilters?: () => void;
};

export function ReportEmptyState({ variant, onClearFilters }: ReportEmptyStateProps) {
  return (
    <div
      className="rounded-lg border border-dashed border-gray-700 px-6 py-10 text-center"
      data-testid={variant === "no-results" ? "report-no-results" : "report-empty"}
      role="status"
    >
      <p className="text-base text-gray-300">
        {variant === "empty" ? REPORT_COPY.empty : REPORT_COPY.noResults}
      </p>
      {variant === "no-results" && onClearFilters ? (
        <button
          className="mt-4 text-sm text-orange-400 hover:text-orange-300"
          type="button"
          onClick={onClearFilters}
        >
          {REPORT_COPY.clearFilters}
        </button>
      ) : null}
    </div>
  );
}

export function ReportForbiddenState() {
  return (
    <main
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center"
      data-testid="report-forbidden"
    >
      <h1 className="text-2xl font-semibold text-gray-100">Acesso negado</h1>
      <p className="max-w-md text-base text-gray-400">{REPORT_COPY.forbidden}</p>
    </main>
  );
}

type ReportExportErrorBannerProps = {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
};

export function ReportExportErrorBanner({
  message,
  onDismiss,
  onRetry,
}: ReportExportErrorBannerProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-900/40 bg-amber-950/20 p-3"
      data-testid="report-export-error"
      role="alert"
    >
      <p className="text-sm text-amber-200">{message}</p>
      <div className="flex items-center gap-3">
        {onRetry ? (
          <button
            className="text-sm text-orange-400 hover:text-orange-300"
            type="button"
            onClick={onRetry}
          >
            {REPORT_COPY.retry}
          </button>
        ) : null}
        {onDismiss ? (
          <button
            className="text-sm text-gray-400 hover:text-gray-200"
            type="button"
            onClick={onDismiss}
          >
            Fechar
          </button>
        ) : null}
      </div>
    </div>
  );
}

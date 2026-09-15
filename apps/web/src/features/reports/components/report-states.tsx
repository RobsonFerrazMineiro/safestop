"use client";

import { Inbox, Search } from "lucide-react";

import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { SurfaceIcon } from "@/components/surface-icon";

import { REPORT_COPY } from "../utils/report-copy";

export function ReportPageSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="min-h-[7rem] animate-pulse rounded-lg border border-border bg-card/60"
          />
        ))}
      </div>
      <div className="h-12 animate-pulse rounded-lg border border-border bg-card/60" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-lg border border-border bg-card/60"
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
      className="flex flex-col items-start gap-2 rounded-lg border border-status-destructive-border bg-status-destructive-bg/40 p-4"
      role="alert"
    >
      <p className="text-sm text-destructive">{message ?? REPORT_COPY.loadError}</p>
      {onRetry ? (
        <Button className="h-auto px-0" size="sm" type="button" variant="link" onClick={onRetry}>
          {REPORT_COPY.retry}
        </Button>
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
      className="rounded-lg border border-border bg-card/60 px-6 py-10 text-center"
      data-testid={variant === "no-results" ? "report-no-results" : "report-empty"}
      role="status"
    >
      <SurfaceIcon
        className="mx-auto mb-3 text-muted-foreground"
        icon={variant === "no-results" ? Search : Inbox}
        variant="empty"
      />
      <p className="text-base text-foreground">
        {variant === "empty" ? REPORT_COPY.empty : REPORT_COPY.noResults}
      </p>
      {variant === "no-results" && onClearFilters ? (
        <Button className="mt-4" type="button" variant="outline" onClick={onClearFilters}>
          {REPORT_COPY.clearFilters}
        </Button>
      ) : null}
    </div>
  );
}

export function ReportForbiddenState() {
  return (
    <PageShell data-testid="report-forbidden" width="wide">
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Acesso negado</h1>
        <p className="max-w-md text-base text-muted-foreground">{REPORT_COPY.forbidden}</p>
      </div>
    </PageShell>
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
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-status-warning-border bg-status-warning-bg/40 p-3"
      data-testid="report-export-error"
      role="alert"
    >
      <p className="text-sm text-status-warning-fg">{message}</p>
      <div className="flex items-center gap-3">
        {onRetry ? (
          <Button className="h-auto px-0" size="sm" type="button" variant="link" onClick={onRetry}>
            {REPORT_COPY.retry}
          </Button>
        ) : null}
        {onDismiss ? (
          <Button
            className="h-auto px-0"
            size="sm"
            type="button"
            variant="ghost"
            onClick={onDismiss}
          >
            Fechar
          </Button>
        ) : null}
      </div>
    </div>
  );
}

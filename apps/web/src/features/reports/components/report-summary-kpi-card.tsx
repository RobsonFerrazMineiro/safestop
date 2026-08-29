"use client";

import { cn } from "@/lib/utils";

type ReportSummaryKpiCardProps = {
  label: string;
  value: number | string;
  tone?: "default" | "destructive" | "warning" | "info";
  isLoading?: boolean;
};

function toneClasses(tone: NonNullable<ReportSummaryKpiCardProps["tone"]>): string {
  switch (tone) {
    case "destructive":
      return "border-status-destructive-border bg-status-destructive-bg/40";
    case "warning":
      return "border-status-warning-border bg-status-warning-bg/40";
    case "info":
      return "border-status-info-border bg-status-info-bg/40";
    default:
      return "border-border bg-card";
  }
}

export function ReportSummaryKpiCard({
  label,
  value,
  tone = "default",
  isLoading,
}: ReportSummaryKpiCardProps) {
  return (
    <div
      aria-label={label}
      className={cn(
        "flex min-h-[7rem] flex-col justify-between gap-2 rounded-lg border p-4",
        toneClasses(tone),
      )}
      role="group"
    >
      <span className="text-3xl font-bold tabular-nums text-foreground">
        {isLoading ? "…" : value}
      </span>
      <span className="line-clamp-2 text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

export function ReportSummaryKpiSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="min-h-[7rem] animate-pulse rounded-lg border border-border bg-card"
    />
  );
}

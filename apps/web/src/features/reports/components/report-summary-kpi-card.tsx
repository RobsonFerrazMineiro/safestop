"use client";

import type { ComponentType } from "react";

import { SurfaceIcon } from "@/components/surface-icon";
import { cn } from "@/lib/utils";

type ReportSummaryKpiCardProps = {
  label: string;
  value: number | string;
  tone?: "default" | "destructive" | "warning" | "info";
  isLoading?: boolean;
  icon?: ComponentType<{ className?: string }>;
  description?: string;
};

function toneClasses(tone: NonNullable<ReportSummaryKpiCardProps["tone"]>): string {
  switch (tone) {
    case "destructive":
      return "border-status-destructive-border border-l-status-destructive-border bg-status-destructive-bg/40";
    case "warning":
      return "border-status-warning-border border-l-status-warning-border bg-status-warning-bg/40";
    case "info":
      return "border-status-info-border border-l-status-info-border bg-status-info-bg/40";
    default:
      return "border-border border-l-border bg-card";
  }
}

function iconToneClass(tone: NonNullable<ReportSummaryKpiCardProps["tone"]>): string {
  switch (tone) {
    case "destructive":
      return "text-status-destructive-fg";
    case "warning":
      return "text-status-warning-fg";
    case "info":
      return "text-status-info-fg";
    default:
      return "text-muted-foreground";
  }
}

export function ReportSummaryKpiCard({
  label,
  value,
  tone = "default",
  isLoading,
  icon,
  description,
}: ReportSummaryKpiCardProps) {
  return (
    <div
      aria-label={label}
      className={cn(
        "flex min-h-[8.5rem] flex-col items-stretch justify-between gap-3 rounded-lg border border-l-4 p-4 text-left",
        toneClasses(tone),
      )}
      role="group"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground line-clamp-2">
          {label}
        </span>
        {icon ? (
          <SurfaceIcon className={cn("shrink-0", iconToneClass(tone))} icon={icon} variant="kpi" />
        ) : null}
      </div>
      <span className="text-3xl font-bold tabular-nums text-foreground">
        {isLoading ? "…" : value}
      </span>
      {description ? (
        <span className="mt-auto border-t border-border/80 pt-2 text-xs text-muted-foreground">
          {description}
        </span>
      ) : null}
    </div>
  );
}

export function ReportSummaryKpiSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="min-h-[8.5rem] animate-pulse rounded-lg border border-border bg-card"
    />
  );
}

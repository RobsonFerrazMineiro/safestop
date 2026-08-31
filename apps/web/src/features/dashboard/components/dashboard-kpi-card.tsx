"use client";

import Link from "next/link";
import {
  DASHBOARD_METRIC_CATALOG,
  type DashboardMetricKey,
  type PermissionCode,
} from "@safestop/types";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceIcon } from "@/components/surface-icon";
import { cn } from "@/lib/utils";
import { useAuthorization } from "@/features/authorization";

import { iconForMetric } from "./utils/dashboard-kpi-icons";
import { formatDashboardMetricValue } from "./utils/format-metric-value";
import {
  detailForMetric,
  hasMetricPermission,
  hrefForMetric,
  toneForMetric,
} from "./utils/kpi-config";

type DashboardKpiCardProps = {
  metricKey: DashboardMetricKey;
  value: number;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

function hasPermission(
  can: (code: PermissionCode) => boolean,
  canAny: (codes: PermissionCode[]) => boolean,
  metricKey: DashboardMetricKey,
): boolean {
  return hasMetricPermission(can, canAny, metricKey);
}

function toneClasses(tone: ReturnType<typeof toneForMetric>): string {
  switch (tone) {
    case "destructive":
      return "border-status-destructive-border border-l-status-destructive-border bg-status-destructive-bg/40";
    case "warning":
      return "border-status-warning-border border-l-status-warning-border bg-status-warning-bg/40";
    case "info":
      return "border-status-info-border border-l-status-info-border bg-status-info-bg/40";
    case "success":
      return "border-status-success-border border-l-status-success-border bg-status-success-bg/40";
    default:
      return "border-border border-l-border bg-card";
  }
}

function iconToneClass(tone: ReturnType<typeof toneForMetric>): string {
  switch (tone) {
    case "destructive":
      return "text-status-destructive-fg";
    case "warning":
      return "text-status-warning-fg";
    case "info":
      return "text-status-info-fg";
    case "success":
      return "text-status-success-fg";
    default:
      return "text-muted-foreground";
  }
}

function DashboardKpiCardInner({
  metricKey,
  value,
  isLoading,
  isError,
  onRetry,
}: DashboardKpiCardProps) {
  const label = DASHBOARD_METRIC_CATALOG[metricKey].label;
  const href = hrefForMetric(metricKey);
  const tone = toneForMetric(metricKey);
  const cardTone = toneClasses(tone);
  const formattedValue = formatDashboardMetricValue(metricKey, value);
  const MetricIcon = iconForMetric(metricKey);
  const detail = detailForMetric(metricKey);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground line-clamp-2">
          {label}
        </span>
        <SurfaceIcon
          className={cn("shrink-0", iconToneClass(tone))}
          icon={MetricIcon}
          variant="kpi"
        />
      </div>
      <span className="text-left text-3xl font-bold tabular-nums text-foreground">
        {isLoading ? "…" : isError ? "—" : formattedValue}
      </span>
      <span className="mt-auto border-t border-border/80 pt-2 text-left text-xs text-muted-foreground">
        {detail}
      </span>
    </>
  );

  const className = cn(
    "flex min-h-[8.5rem] w-full flex-col items-stretch justify-between gap-3 rounded-lg border border-l-4 p-4 text-left shadow-sm",
    cardTone,
  );

  if (href && !isError && !isLoading) {
    return (
      <Link
        aria-label={`${label}: ${formattedValue}`}
        className={cn(
          className,
          "transition hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        )}
        href={href}
      >
        {body}
      </Link>
    );
  }

  return (
    <div aria-label={label} className={className} role="group">
      {body}
      {isError ? (
        <Button
          className="h-auto justify-start px-0 text-primary"
          size="sm"
          type="button"
          variant="link"
          onClick={() => {
            onRetry?.();
          }}
        >
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

export function DashboardKpiCard(props: DashboardKpiCardProps) {
  const { can, canAny } = useAuthorization();

  if (!hasPermission(can, canAny, props.metricKey)) {
    return null;
  }

  return <DashboardKpiCardInner {...props} />;
}

export function DashboardKpiCardSkeleton() {
  return <Skeleton aria-hidden="true" className="min-h-[8.5rem] rounded-lg" />;
}

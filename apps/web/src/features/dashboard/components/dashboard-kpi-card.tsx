"use client";

import Link from "next/link";
import {
  DASHBOARD_METRIC_CATALOG,
  type DashboardMetricKey,
  type PermissionCode,
} from "@safestop/types";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuthorization } from "@/features/authorization";

import { formatDashboardMetricValue } from "./utils/format-metric-value";
import { hasMetricPermission, hrefForMetric, toneForMetric } from "./utils/kpi-config";

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
      return "border-status-destructive-border bg-status-destructive-bg/40";
    case "warning":
      return "border-status-warning-border bg-status-warning-bg/40";
    case "info":
      return "border-status-info-border bg-status-info-bg/40";
    case "success":
      return "border-status-success-border bg-status-success-bg/40";
    default:
      return "border-border bg-card";
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
  const tone = toneClasses(toneForMetric(metricKey));
  const formattedValue = formatDashboardMetricValue(metricKey, value);

  const body = (
    <>
      <span className="text-3xl font-bold tabular-nums text-foreground">
        {isLoading ? "…" : isError ? "—" : formattedValue}
      </span>
      <span className="line-clamp-2 text-sm text-muted-foreground">{label}</span>
    </>
  );

  const className = cn(
    "flex min-h-[7rem] flex-col justify-between gap-2 rounded-lg border p-4 text-left shadow-sm",
    tone,
  );

  if (href && !isError && !isLoading) {
    return (
      <Button
        asChild
        className={cn(className, "h-auto w-full whitespace-normal hover:bg-accent/40")}
        variant="ghost"
      >
        <Link aria-label={`${label}: ${formattedValue}`} href={href}>
          {body}
        </Link>
      </Button>
    );
  }

  return (
    <div aria-label={label} className={className} role="group">
      {body}
      {isError ? (
        <Button
          className="mt-1 h-auto justify-start px-0 text-primary"
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
  return <Skeleton aria-hidden="true" className="min-h-[7rem] rounded-lg" />;
}

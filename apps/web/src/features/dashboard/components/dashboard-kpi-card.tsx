"use client";

import Link from "next/link";
import {
  DASHBOARD_METRIC_CATALOG,
  type DashboardMetricKey,
  type PermissionCode,
} from "@safestop/types";

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
      return "border-red-800/60 bg-red-950/20";
    case "warning":
      return "border-amber-700/50 bg-amber-950/20";
    case "info":
      return "border-blue-800/60 bg-blue-950/20";
    case "success":
      return "border-green-800/60 bg-green-950/20";
    default:
      return "border-gray-800 bg-gray-900/40";
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

  const content = (
    <>
      <span className="text-3xl font-bold tabular-nums text-gray-100">
        {isLoading ? "…" : isError ? "—" : formatDashboardMetricValue(metricKey, value)}
      </span>
      <span className="line-clamp-2 text-sm text-gray-400">{label}</span>
      {isError ? (
        <button
          className="mt-1 text-left text-xs text-orange-400 hover:text-orange-300"
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRetry?.();
          }}
        >
          Tentar novamente
        </button>
      ) : null}
    </>
  );

  const className = `flex min-h-[7rem] flex-col justify-between gap-2 rounded-lg border p-4 ${tone} ${
    href && !isError ? "transition hover:border-gray-600" : ""
  }`;

  if (href && !isError && !isLoading) {
    return (
      <Link
        aria-label={`${label}: ${formatDashboardMetricValue(metricKey, value)}`}
        className={className}
        href={href}
      >
        {content}
      </Link>
    );
  }

  return (
    <div aria-label={label} className={className} role="group">
      {content}
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
  return (
    <div
      aria-hidden="true"
      className="min-h-[7rem] animate-pulse rounded-lg border border-gray-800 bg-gray-900/40"
    />
  );
}

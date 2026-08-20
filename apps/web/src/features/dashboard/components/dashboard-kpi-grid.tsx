"use client";

import type { DashboardKpis, DashboardMetricKey } from "@safestop/types";
import { DASHBOARD_METRIC_CATALOG } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";

import { DashboardKpiCard, DashboardKpiCardSkeleton } from "./dashboard-kpi-card";
import { hasMetricPermission } from "./utils/kpi-config";

type DashboardKpiGridProps = {
  kpis: DashboardKpis | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  periodActive: boolean;
};

function readMetricValue(kpis: DashboardKpis, key: DashboardMetricKey): number | null {
  if (key in kpis.personal) {
    return kpis.personal[key as keyof typeof kpis.personal];
  }

  if (key in kpis.operational) {
    return kpis.operational[key as keyof typeof kpis.operational];
  }

  return kpis.managerial[key as keyof typeof kpis.managerial];
}

function usePermittedMetricKeys(keys: DashboardMetricKey[]): DashboardMetricKey[] {
  const { can, canAny } = useAuthorization();

  return keys.filter((key) => hasMetricPermission(can, canAny, key));
}

function shouldRenderMetric(
  key: DashboardMetricKey,
  kpis: DashboardKpis | undefined,
  isLoading: boolean,
): boolean {
  if (isLoading) {
    return true;
  }

  if (!kpis) {
    return false;
  }

  return readMetricValue(kpis, key) !== null;
}

function DashboardKpiSlot({
  metricKey,
  kpis,
  isLoading,
  isError,
  onRetry,
}: {
  metricKey: DashboardMetricKey;
  kpis: DashboardKpis | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (!shouldRenderMetric(metricKey, kpis, isLoading)) {
    return null;
  }

  if (isLoading) {
    return <DashboardKpiCardSkeleton />;
  }

  const value = kpis ? readMetricValue(kpis, metricKey) : null;

  if (value === null) {
    return null;
  }

  return (
    <DashboardKpiCard
      isError={isError}
      isLoading={isLoading}
      metricKey={metricKey}
      value={value}
      onRetry={onRetry}
    />
  );
}

function DashboardKpiGridSection({
  label,
  keys,
  kpis,
  isLoading,
  isError,
  onRetry,
  gridClassName,
}: {
  label: string;
  keys: DashboardMetricKey[];
  kpis: DashboardKpis | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  gridClassName: string;
}) {
  const permittedKeys = usePermittedMetricKeys(keys);
  const visibleKeys = permittedKeys.filter((key) => shouldRenderMetric(key, kpis, isLoading));

  if (visibleKeys.length === 0) {
    return null;
  }

  return (
    <section aria-label={label} className="flex flex-col gap-3">
      <div className={gridClassName}>
        {visibleKeys.map((key) => (
          <DashboardKpiSlot
            key={key}
            isError={isError}
            isLoading={isLoading}
            kpis={kpis}
            metricKey={key}
            onRetry={onRetry}
          />
        ))}
      </div>
    </section>
  );
}

export function DashboardKpiLevel1Grid({
  kpis,
  isLoading,
  isError,
  onRetry,
}: Omit<DashboardKpiGridProps, "periodActive">) {
  const slot1Key: DashboardMetricKey =
    kpis && kpis.managerial.overdueActionItems !== null ? "overdueActionItems" : "myOverdueActions";

  const level1Keys: DashboardMetricKey[] = [
    slot1Key,
    "myPendingAwareness",
    "activeOccurrences",
    "mdhoPendingApproval",
  ];

  return (
    <DashboardKpiGridSection
      gridClassName="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
      isError={isError}
      isLoading={isLoading}
      keys={level1Keys}
      kpis={kpis}
      label="Indicadores de atenção imediata"
      onRetry={onRetry}
    />
  );
}

export function DashboardKpiLevel2Grid({
  kpis,
  isLoading,
  isError,
  onRetry,
}: Omit<DashboardKpiGridProps, "periodActive">) {
  const level1Keys = new Set<DashboardMetricKey>([
    "overdueActionItems",
    "myOverdueActions",
    "myPendingAwareness",
    "activeOccurrences",
    "mdhoPendingApproval",
  ]);

  const level2Order = (
    [
      "pendingEvaluation",
      "activeInterdictions",
      "awaitingValidation",
      "dueSoonActionItems",
      "openActionPlans",
      "scopedOpenOccurrences",
      "scopedPendingAwareness",
      "pendingAwarenessOrg",
      "myPendingActions",
    ] satisfies DashboardMetricKey[]
  ).filter((key) => !level1Keys.has(key) || key === "myPendingActions");

  return (
    <DashboardKpiGridSection
      gridClassName="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4"
      isError={isError}
      isLoading={isLoading}
      keys={level2Order}
      kpis={kpis}
      label="Indicadores de estoque"
      onRetry={onRetry}
    />
  );
}

export function DashboardKpiLevel3Grid({
  kpis,
  isLoading,
  isError,
  onRetry,
  periodActive,
}: DashboardKpiGridProps) {
  if (!periodActive) {
    return (
      <p className="text-sm text-gray-500" role="status">
        O período afeta apenas indicadores de fluxo
      </p>
    );
  }

  const flowKeys: DashboardMetricKey[] = [
    "newOccurrencesInPeriod",
    "avgEvaluationTimeMinutes",
    "avgReleaseTimeMinutes",
    "actionCompletionRate",
  ];

  return (
    <section aria-label="Indicadores de fluxo no período" className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        Indicadores do período
      </h2>
      <DashboardKpiGridSection
        gridClassName="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
        isError={isError}
        isLoading={isLoading}
        keys={flowKeys}
        kpis={kpis}
        label="Indicadores de fluxo no período"
        onRetry={onRetry}
      />
    </section>
  );
}

export function hasAnyVisibleKpi(kpis: DashboardKpis | undefined): boolean {
  if (!kpis) {
    return false;
  }

  const keys = Object.keys(DASHBOARD_METRIC_CATALOG) as DashboardMetricKey[];

  return keys.some((key) => readMetricValue(kpis, key) !== null);
}

export function hasOnlyPersonalKpis(kpis: DashboardKpis): boolean {
  const managerialVisible = Object.values(kpis.managerial).some((value) => value !== null);
  const operationalVisible = Object.values(kpis.operational).some((value) => value !== null);

  return !managerialVisible && !operationalVisible;
}

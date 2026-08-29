"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  DashboardOccurrenceStatusFamily,
  DashboardPeriodFilter as DashboardPeriodFilterValue,
} from "@safestop/types";
import {
  DASHBOARD_DUE_SOON_DAYS_DEFAULT,
  DASHBOARD_OCCURRENCE_STATUS_FAMILIES,
  DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS,
} from "@safestop/types";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Can, useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";

import { useDashboardAttention } from "../hooks/use-dashboard-attention";
import { useDashboardDistribution } from "../hooks/use-dashboard-distribution";
import { useDashboardKpis } from "../hooks/use-dashboard-kpis";
import { useDashboardRecentOccurrences } from "../hooks/use-dashboard-recent-occurrences";
import { useDashboardScopeOccurrences } from "../hooks/use-dashboard-scope-occurrences";
import { DashboardActionAttentionList } from "./dashboard-action-attention-list";
import { DashboardDistributionChart, DashboardMainChart } from "./dashboard-charts";
import {
  DashboardKpiLevel1Grid,
  DashboardKpiLevel2Grid,
  DashboardKpiLevel3Grid,
  hasAnyVisibleKpi,
  hasOnlyPersonalKpis,
} from "./dashboard-kpi-grid";
import { DashboardPeriodFilter } from "./dashboard-period-filter";
import { DashboardRecentOccurrences } from "./dashboard-recent-occurrences";
import { DashboardScopeFiltersPanel } from "./dashboard-scope-filters";
import {
  DashboardEmptyNoOccurrences,
  DashboardEmptyNoProfileKpis,
  DashboardForbiddenState,
  DashboardSectionError,
} from "./dashboard-states";
import { useDashboardVolumeChart } from "./use-dashboard-volume-chart";
import {
  EMPTY_DASHBOARD_SCOPE_FILTERS,
  hasActiveDashboardScopeFilters,
  type DashboardScopeFilters,
} from "../types/scope-filters";
import { applyScopeFiltersToAttention } from "../utils/apply-scope-to-attention";
import { computeScopedDistributionFromOccurrences } from "../utils/compute-scoped-distribution";
import { mergeAttentionIntoKpis, mergeScopeFiltersIntoKpis } from "../utils/merge-display-kpis";
import {
  DASHBOARD_DEFAULT_PERIOD_PRESET,
  resolveDashboardPeriodPreset,
  type DashboardPeriodPresetId,
} from "./utils/period-presets";
import { dashboardDeepLinks } from "./utils/dashboard-deep-links";
import { canAccessDashboard } from "./utils/kpi-config";

const FAMILY_COLORS: Record<DashboardOccurrenceStatusFamily, string> = {
  OPEN_EVALUATION: "#2563EB",
  VER_E_AGIR: "#F59E0B",
  INTERDICTED: "#DC2626",
  IN_TREATMENT: "#F97316",
  AWAITING_VALIDATION: "#FB923C",
  COMPLETED: "#16A34A",
  CANCELLED: "#6B7280",
};

export function DashboardPage() {
  const { activeOrganization } = useActiveOrganization();
  const { can, canAny, isReady: isAuthzReady } = useAuthorization();
  const [periodPreset, setPeriodPreset] = useState<DashboardPeriodPresetId>(
    DASHBOARD_DEFAULT_PERIOD_PRESET,
  );

  const [scopeFilters, setScopeFilters] = useState<DashboardScopeFilters>(
    EMPTY_DASHBOARD_SCOPE_FILTERS,
  );
  const scopeFiltersActive = hasActiveDashboardScopeFilters(scopeFilters);

  const period = useMemo<DashboardPeriodFilterValue>(
    () => resolveDashboardPeriodPreset(periodPreset),
    [periodPreset],
  );

  const kpiFilters = useMemo(
    () => ({
      period,
      dueSoonDays: DASHBOARD_DUE_SOON_DAYS_DEFAULT,
    }),
    [period],
  );

  const {
    kpis,
    isLoading: isKpisLoading,
    isError: isKpisError,
    refetch: refetchKpis,
  } = useDashboardKpis(kpiFilters);

  const {
    distribution,
    isLoading: isDistributionLoading,
    isError: isDistributionError,
    refetch: refetchDistribution,
    enabled: distributionEnabled,
  } = useDashboardDistribution({ period });

  const {
    attention: rawAttention,
    isLoading: isAttentionLoading,
    isError: isAttentionError,
    refetch: refetchAttention,
    enabled: attentionEnabled,
  } = useDashboardAttention({ dueSoonDays: DASHBOARD_DUE_SOON_DAYS_DEFAULT });

  const { scopeOccurrences, isLoading: isScopeOccurrencesLoading } =
    useDashboardScopeOccurrences(scopeFilters);

  const attention = useMemo(
    () => applyScopeFiltersToAttention(rawAttention, scopeOccurrences, scopeFilters),
    [rawAttention, scopeFilters, scopeOccurrences],
  );

  const displayKpis = useMemo(() => {
    if (!kpis) {
      return undefined;
    }

    let next = mergeAttentionIntoKpis(kpis, attention, attentionEnabled);

    if (scopeFiltersActive && scopeOccurrences.length > 0) {
      next = mergeScopeFiltersIntoKpis(next, scopeOccurrences, scopeFilters, period);
    }

    return next;
  }, [
    attention,
    attentionEnabled,
    kpis,
    period,
    scopeFilters,
    scopeFiltersActive,
    scopeOccurrences,
  ]);

  const {
    recentOccurrences,
    isLoading: isRecentLoading,
    isError: isRecentError,
    refetch: refetchRecent,
    enabled: recentEnabled,
  } = useDashboardRecentOccurrences(scopeFilters);

  const {
    buckets: volumeBuckets,
    isLoading: isVolumeLoading,
    isError: isVolumeError,
    refetch: refetchVolume,
  } = useDashboardVolumeChart(period, distributionEnabled, scopeFilters);

  const showEmptyNoOccurrences =
    !isKpisLoading &&
    kpis &&
    (kpis.managerial.activeOccurrences ?? 0) === 0 &&
    recentOccurrences.length === 0 &&
    recentEnabled;

  const showEmptyProfileBanner =
    !isKpisLoading && kpis && hasOnlyPersonalKpis(kpis) && hasAnyVisibleKpi(kpis);

  const showEmptyNoKpisAtAll = !isKpisLoading && kpis && !hasAnyVisibleKpi(kpis);

  const statusFamilyBuckets = useMemo(() => {
    if (scopeFiltersActive && scopeOccurrences.length > 0) {
      return computeScopedDistributionFromOccurrences(
        scopeOccurrences,
        scopeFilters,
      ).statusFamilyBuckets.map((bucket) => ({
        ...bucket,
        fill: FAMILY_COLORS[
          (DASHBOARD_OCCURRENCE_STATUS_FAMILIES.find(
            (family) => DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS[family] === bucket.label,
          ) ?? "OPEN_EVALUATION") as DashboardOccurrenceStatusFamily
        ],
      }));
    }

    const byStatusFamily = distribution?.byStatusFamily;

    if (!byStatusFamily) {
      return [];
    }

    return DASHBOARD_OCCURRENCE_STATUS_FAMILIES.map((family) => ({
      label: DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS[family],
      count: byStatusFamily[family] ?? 0,
      fill: FAMILY_COLORS[family],
    }));
  }, [distribution, scopeFilters, scopeFiltersActive, scopeOccurrences]);

  const areaBuckets = useMemo(() => {
    if (scopeFiltersActive && scopeOccurrences.length > 0) {
      return computeScopedDistributionFromOccurrences(scopeOccurrences, scopeFilters).areaBuckets;
    }

    return (distribution?.byArea ?? []).slice(0, 8).map((item) => ({
      label: item.label,
      count: item.count,
    }));
  }, [distribution?.byArea, scopeFilters, scopeFiltersActive, scopeOccurrences]);

  const contractorBuckets = useMemo(() => {
    if (scopeFiltersActive && scopeOccurrences.length > 0) {
      return computeScopedDistributionFromOccurrences(scopeOccurrences, scopeFilters)
        .contractorBuckets;
    }

    return (distribution?.byContractor ?? []).slice(0, 8).map((item) => ({
      label: item.label,
      count: item.count,
    }));
  }, [distribution?.byContractor, scopeFilters, scopeFiltersActive, scopeOccurrences]);

  if (isAuthzReady && activeOrganization && !canAccessDashboard(can, canAny)) {
    return <DashboardForbiddenState />;
  }

  return (
    <section className="flex w-full flex-col gap-8 px-6 py-10">
      <PageHeader
        actions={
          <div className="flex w-full flex-col gap-3 sm:w-auto lg:items-end">
            <DashboardPeriodFilter activePreset={periodPreset} onChange={setPeriodPreset} />
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <Can permission="occurrence.read">
                <DashboardScopeFiltersPanel filters={scopeFilters} onChange={setScopeFilters} />
              </Can>
              <Can permission="occurrence.create">
                <Button asChild className="hidden md:inline-flex">
                  <Link href="/stop-work/new">Nova Paralisação</Link>
                </Button>
              </Can>
            </div>
          </div>
        }
        subtitle={`Visão operacional da organização ativa${
          activeOrganization ? ` — ${activeOrganization.name}` : ""
        }`}
        title="Dashboard"
      />

      {isKpisError ? (
        <DashboardSectionError
          message="Não foi possível carregar os indicadores."
          onRetry={() => {
            void refetchKpis();
          }}
        />
      ) : null}

      {showEmptyProfileBanner || showEmptyNoKpisAtAll ? <DashboardEmptyNoProfileKpis /> : null}

      {!showEmptyNoKpisAtAll ? (
        <>
          <DashboardKpiLevel1Grid
            isError={isKpisError}
            isLoading={isKpisLoading || (scopeFiltersActive && isScopeOccurrencesLoading)}
            kpis={displayKpis}
            onRetry={() => {
              void refetchKpis();
            }}
          />

          <DashboardKpiLevel2Grid
            isError={isKpisError}
            isLoading={isKpisLoading || (scopeFiltersActive && isScopeOccurrencesLoading)}
            kpis={displayKpis}
            onRetry={() => {
              void refetchKpis();
            }}
          />

          <DashboardKpiLevel3Grid
            isError={isKpisError}
            isLoading={isKpisLoading || (scopeFiltersActive && isScopeOccurrencesLoading)}
            kpis={displayKpis}
            periodActive
            onRetry={() => {
              void refetchKpis();
            }}
          />
        </>
      ) : null}

      {showEmptyNoOccurrences ? (
        <DashboardEmptyNoOccurrences />
      ) : (
        <>
          <Can permission="occurrence.read">
            {isVolumeLoading ? null : isVolumeError ? (
              <DashboardSectionError
                onRetry={() => {
                  void refetchVolume();
                }}
              />
            ) : (
              <DashboardMainChart
                buckets={volumeBuckets}
                emptyMessage="Nenhuma paralisação neste período"
                title="Novas paralisações no período"
              />
            )}
          </Can>

          <Can permission="occurrence.read">
            {distributionEnabled && !isDistributionLoading && !isDistributionError ? (
              <div className="hidden flex-col gap-4 md:flex">
                <DashboardDistributionChart
                  buckets={statusFamilyBuckets}
                  emptyMessage="Sem dados de distribuição"
                  title="Paralisações por situação"
                />
                <DashboardDistributionChart
                  buckets={areaBuckets}
                  emptyMessage="Nenhuma paralisação neste período"
                  title="Paralisações por área"
                />
                {contractorBuckets.length > 0 ? (
                  <DashboardDistributionChart
                    buckets={contractorBuckets}
                    emptyMessage="Sem dados por contratada"
                    title="Paralisações por contratada"
                  />
                ) : null}
              </div>
            ) : null}

            {isDistributionError ? (
              <DashboardSectionError
                onRetry={() => {
                  void refetchDistribution();
                }}
              />
            ) : null}
          </Can>

          <DashboardRecentOccurrences
            enabled={recentEnabled}
            isError={isRecentError}
            isLoading={isRecentLoading}
            items={recentOccurrences}
            onRetry={() => {
              void refetchRecent();
            }}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DashboardActionAttentionList
              count={attention?.overdueCount ?? null}
              emptyMessage="Nenhuma ação vencida."
              enabled={attentionEnabled}
              isError={isAttentionError}
              isLoading={isAttentionLoading}
              items={attention?.overdueItems ?? []}
              title="Ações vencidas"
              viewAllHref={dashboardDeepLinks.actionItemsOverdue}
              onRetry={() => {
                void refetchAttention();
              }}
            />

            <DashboardActionAttentionList
              count={attention?.dueSoonCount ?? null}
              emptyMessage="Nenhuma ação próxima do vencimento."
              enabled={attentionEnabled}
              isError={isAttentionError}
              isLoading={isAttentionLoading}
              items={attention?.dueSoonItems ?? []}
              title="Ações próximas do vencimento"
              viewAllHref={dashboardDeepLinks.actionItemsDueSoon}
              onRetry={() => {
                void refetchAttention();
              }}
            />
          </div>
        </>
      )}
    </section>
  );
}

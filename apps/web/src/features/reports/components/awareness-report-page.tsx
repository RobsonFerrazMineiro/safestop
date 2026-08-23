"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { computeAwarenessReportSummary, type AwarenessReportSortField } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import type { DashboardPeriodPresetId } from "@/features/dashboard/components/utils/period-presets";
import { DASHBOARD_PERIOD_PRESETS } from "@/features/dashboard/components/utils/period-presets";

import { AwarenessReportFiltersDialog } from "./awareness-report-filters-dialog";
import { AwarenessReportTable } from "./awareness-report-table";
import { useAwarenessReport } from "../hooks/use-awareness-report";
import { useReportExport } from "../hooks/use-report-export";
import { useReportPagination } from "../hooks/use-report-pagination";
import { exportAwarenessReportCsv } from "../services/export-awareness-csv";
import { exportAwarenessReportXlsx } from "../services/export-awareness-xlsx";
import {
  awarenessViewStateToFilters,
  awarenessViewStateToSort,
  emptyAwarenessReportViewState,
  hasActiveAwarenessReportFilters,
  parseAwarenessReportViewState,
  serializeAwarenessReportViewState,
  type AwarenessReportViewState,
} from "../utils/awareness-report-url";
import { REPORT_COPY } from "../utils/report-copy";
import { ReportExportMenu } from "./report-export-menu";
import { ReportPaginationControls } from "./report-pagination-controls";
import { ReportPeriodFilter } from "./report-period-filter";
import {
  ReportEmptyState,
  ReportErrorState,
  ReportExportErrorBanner,
  ReportForbiddenState,
  ReportPageSkeleton,
} from "./report-states";
import { ReportSummaryKpiCard } from "./report-summary-kpi-card";

function countAwarenessActiveFilters(state: AwarenessReportViewState): number {
  let count = 0;

  if (state.recipientMemberId) count += 1;
  if (state.pendingOnly) count += 1;

  return count;
}

export function AwarenessReportPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can, isReady, isLoading: isAuthLoading } = useAuthorization();
  const { activeOrganization } = useActiveOrganization();

  const viewState = useMemo(() => parseAwarenessReportViewState(searchParams), [searchParams]);

  const filters = useMemo(() => awarenessViewStateToFilters(viewState), [viewState]);
  const sort = useMemo(() => awarenessViewStateToSort(viewState), [viewState]);

  const { pagination, canGoPrevious, resetPagination, goNext, goPrevious } = useReportPagination();

  const canRead = can("report.read");
  const query = useAwarenessReport(filters, sort, pagination, canRead && isReady);
  const { isExporting, exportError, runExport, clearExportError } = useReportExport();

  const replaceViewState = useCallback(
    (next: AwarenessReportViewState) => {
      router.replace(`${pathname}${serializeAwarenessReportViewState(next)}`);
      resetPagination();
    },
    [pathname, resetPagination, router],
  );

  useEffect(() => {
    resetPagination();
  }, [searchParams, resetPagination]);

  const summary = useMemo(
    () => computeAwarenessReportSummary(query.data?.items ?? []),
    [query.data?.items],
  );

  const activeFilters = hasActiveAwarenessReportFilters(viewState);
  const activeFilterCount = countAwarenessActiveFilters(viewState);
  const items = query.data?.items ?? [];
  const hasNext = query.data?.hasNext ?? false;

  function handleSort(field: AwarenessReportSortField) {
    const nextDirection =
      viewState.sortField === field && viewState.sortDirection === "desc" ? "asc" : "desc";

    replaceViewState({
      ...viewState,
      sortField: field,
      sortDirection: nextDirection,
    });
  }

  function handlePeriodChange(preset: DashboardPeriodPresetId) {
    replaceViewState({ ...viewState, periodPreset: preset });
  }

  function handleClearFilters() {
    replaceViewState(emptyAwarenessReportViewState());
  }

  if (isAuthLoading || !isReady) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-8">
        <ReportPageSkeleton />
      </main>
    );
  }

  if (!canRead) {
    return <ReportForbiddenState />;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8" data-testid="report-awareness-page">
      <header className="mb-6">
        <Link className="text-sm text-gray-400 hover:text-gray-200" href="/reports">
          ← {REPORT_COPY.hubTitle}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-100">{REPORT_COPY.awareness}</h1>
        <p className="mt-1 text-sm text-gray-400">
          {activeOrganization?.name ?? "Organização"} · {items.length} registros nesta página
        </p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ReportSummaryKpiCard
          isLoading={query.isLoading}
          label={`${REPORT_COPY.onThisPage}: total`}
          value={summary.totalRows}
        />
        <ReportSummaryKpiCard
          isLoading={query.isLoading}
          label="Pendentes de ciência"
          tone="warning"
          value={summary.pendingCount}
        />
      </section>

      <section className="mb-4 flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-900/20 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <ReportPeriodFilter activePreset={viewState.periodPreset} onChange={handlePeriodChange} />
          <div className="flex flex-wrap items-center gap-2">
            <AwarenessReportFiltersDialog
              activeFilterCount={activeFilterCount}
              filters={viewState}
              onApply={replaceViewState}
            />
            <ReportExportMenu
              isExporting={isExporting}
              onExportCsv={() => {
                void runExport(() => exportAwarenessReportCsv(query.organizationId, filters, sort));
              }}
              onExportXlsx={() => {
                void runExport(() =>
                  exportAwarenessReportXlsx(query.organizationId, filters, sort),
                );
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              checked={viewState.showOptionalColumns}
              className="accent-orange-500"
              type="checkbox"
              onChange={(event) => {
                replaceViewState({
                  ...viewState,
                  showOptionalColumns: event.target.checked,
                });
              }}
            />
            {REPORT_COPY.showOptionalColumns}
          </label>
          {activeFilters ? (
            <button
              className="text-sm text-orange-400 hover:text-orange-300"
              type="button"
              onClick={handleClearFilters}
            >
              {REPORT_COPY.clearFilters}
            </button>
          ) : null}
        </div>

        {activeFilters ? (
          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
            {DASHBOARD_PERIOD_PRESETS.map((preset) =>
              viewState.periodPreset === preset.id ? (
                <span key={preset.id} className="rounded-full border border-gray-700 px-2 py-1">
                  Período: {preset.label}
                </span>
              ) : null,
            )}
            {viewState.pendingOnly ? (
              <span className="rounded-full border border-gray-700 px-2 py-1">
                Pendentes de ciência
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      {exportError ? (
        <div className="mb-4">
          <ReportExportErrorBanner message={exportError} onDismiss={clearExportError} />
        </div>
      ) : null}

      {query.isLoading ? <ReportPageSkeleton /> : null}

      {query.isError ? <ReportErrorState onRetry={() => void query.refetch()} /> : null}

      {!query.isLoading && !query.isError ? (
        items.length === 0 ? (
          <ReportEmptyState
            variant={activeFilters ? "no-results" : "empty"}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <>
            <AwarenessReportTable
              caption={`Relatório de ${REPORT_COPY.awareness}`}
              rows={items}
              showOptionalColumns={viewState.showOptionalColumns}
              sortDirection={viewState.sortDirection}
              sortField={viewState.sortField}
              onSort={handleSort}
            />
            <div className="mt-4">
              <ReportPaginationControls
                canGoPrevious={canGoPrevious}
                hasNext={hasNext}
                itemCount={items.length}
                onNext={() => {
                  goNext(query.data?.nextCursor ?? null);
                }}
                onPrevious={goPrevious}
              />
            </div>
          </>
        )
      ) : null}
    </main>
  );
}

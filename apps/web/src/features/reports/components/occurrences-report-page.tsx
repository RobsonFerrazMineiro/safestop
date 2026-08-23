"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { computeOccurrenceReportSummary, type OccurrenceReportSortField } from "@safestop/types";

import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import type { DashboardPeriodPresetId } from "@/features/dashboard/components/utils/period-presets";
import { DASHBOARD_PERIOD_PRESETS } from "@/features/dashboard/components/utils/period-presets";
import {
  formatOccurrenceSeverity,
  formatOccurrenceStatus,
} from "@/features/occurrences/utils/format-labels";

import { useOccurrencesReport } from "../hooks/use-occurrences-report";
import { useReportExport } from "../hooks/use-report-export";
import { useReportPagination } from "../hooks/use-report-pagination";
import { exportOccurrencesReportCsv } from "../services/export-occurrences-csv";
import { exportOccurrencesReportXlsx } from "../services/export-occurrences-xlsx";
import {
  emptyOccurrenceReportViewState,
  hasActiveOccurrenceReportFilters,
  occurrenceViewStateToFilters,
  occurrenceViewStateToSort,
  parseOccurrenceReportViewState,
  serializeOccurrenceReportViewState,
  type OccurrenceReportViewState,
} from "../utils/occurrence-report-url";
import { REPORT_COPY } from "../utils/report-copy";
import { OccurrenceReportFiltersDialog } from "./occurrence-report-filters-dialog";
import { OccurrencesReportTable } from "./occurrences-report-table";
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

function countOccurrenceActiveFilters(state: OccurrenceReportViewState): number {
  let count = 0;

  if (state.areaId) count += 1;
  if (state.contractId) count += 1;
  if (state.contractorOrganizationId) count += 1;
  if (state.status.length > 0) count += 1;
  if (state.severity.length > 0) count += 1;
  if (state.hasIms !== null) count += 1;

  return count;
}

export function OccurrencesReportPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can, isReady, isLoading: isAuthLoading } = useAuthorization();
  const { activeOrganization } = useActiveOrganization();

  const viewState = useMemo(() => parseOccurrenceReportViewState(searchParams), [searchParams]);

  const filters = useMemo(() => occurrenceViewStateToFilters(viewState), [viewState]);
  const sort = useMemo(() => occurrenceViewStateToSort(viewState), [viewState]);

  const { pagination, canGoPrevious, resetPagination, goNext, goPrevious } = useReportPagination();

  const canRead = can("report.read");
  const query = useOccurrencesReport(filters, sort, pagination, canRead && isReady);
  const { isExporting, exportError, runExport, clearExportError } = useReportExport();

  const replaceViewState = useCallback(
    (next: OccurrenceReportViewState) => {
      router.replace(`${pathname}${serializeOccurrenceReportViewState(next)}`);
      resetPagination();
    },
    [pathname, resetPagination, router],
  );

  useEffect(() => {
    resetPagination();
  }, [searchParams, resetPagination]);

  const summary = useMemo(
    () => computeOccurrenceReportSummary(query.data?.items ?? []),
    [query.data?.items],
  );

  const activeFilters = hasActiveOccurrenceReportFilters(viewState);
  const activeFilterCount = countOccurrenceActiveFilters(viewState);
  const items = query.data?.items ?? [];
  const hasNext = query.data?.hasNext ?? false;

  function handleSort(field: OccurrenceReportSortField) {
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
    replaceViewState(emptyOccurrenceReportViewState());
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
    <main className="mx-auto max-w-6xl px-6 py-8" data-testid="report-occurrences-page">
      <header className="mb-6">
        <Link className="text-sm text-gray-400 hover:text-gray-200" href="/reports">
          ← {REPORT_COPY.hubTitle}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-100">{REPORT_COPY.occurrences}</h1>
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
          label={`${REPORT_COPY.onThisPage}: interdições ativas`}
          tone="destructive"
          value={summary.activeInterdictionsCount}
        />
      </section>

      <section className="mb-4 flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-900/20 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <ReportPeriodFilter activePreset={viewState.periodPreset} onChange={handlePeriodChange} />
          <div className="flex flex-wrap items-center gap-2">
            <OccurrenceReportFiltersDialog
              activeFilterCount={activeFilterCount}
              filters={viewState}
              onApply={replaceViewState}
            />
            <ReportExportMenu
              isExporting={isExporting}
              onExportCsv={() => {
                void runExport(() =>
                  exportOccurrencesReportCsv(query.organizationId, filters, sort),
                );
              }}
              onExportXlsx={() => {
                void runExport(() =>
                  exportOccurrencesReportXlsx(query.organizationId, filters, sort),
                );
              }}
            />
          </div>
        </div>

        <label className="flex max-w-md flex-col gap-1 text-sm">
          <span className="text-gray-400">{REPORT_COPY.searchByCode}</span>
          <input
            className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
            type="search"
            value={viewState.search ?? ""}
            onChange={(event) => {
              replaceViewState({
                ...viewState,
                search: event.target.value.trim() ? event.target.value : null,
              });
            }}
          />
        </label>

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
          {activeFilters || viewState.search ? (
            <button
              className="text-sm text-orange-400 hover:text-orange-300"
              type="button"
              onClick={handleClearFilters}
            >
              {REPORT_COPY.clearFilters}
            </button>
          ) : null}
        </div>

        {(activeFilters || viewState.search) && (
          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
            {DASHBOARD_PERIOD_PRESETS.map((preset) =>
              viewState.periodPreset === preset.id ? (
                <span key={preset.id} className="rounded-full border border-gray-700 px-2 py-1">
                  Período: {preset.label}
                </span>
              ) : null,
            )}
            {viewState.status.map((status) => (
              <span key={status} className="rounded-full border border-gray-700 px-2 py-1">
                Status: {formatOccurrenceStatus(status)}
              </span>
            ))}
            {viewState.severity.map((severity) => (
              <span key={severity} className="rounded-full border border-gray-700 px-2 py-1">
                Criticidade: {formatOccurrenceSeverity(severity)}
              </span>
            ))}
          </div>
        )}
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
            variant={activeFilters || viewState.search ? "no-results" : "empty"}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <>
            <OccurrencesReportTable
              caption={`Relatório de ${REPORT_COPY.occurrences}`}
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

"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { computeOccurrenceReportSummary, type OccurrenceReportSortField } from "@safestop/types";

import { OctagonAlert, ShieldAlert } from "lucide-react";

import { FilterShell } from "@/components/filter-shell";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const hasDiscovery = activeFilters || Boolean(viewState.search);
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
      <PageShell width="wide">
        <PageHeader
          backHref="/reports"
          backLabel={REPORT_COPY.hubTitle}
          eyebrow="RELATÓRIO DE OCORRÊNCIAS"
          icon={OctagonAlert}
          title={REPORT_COPY.occurrences}
        />
        <ReportPageSkeleton />
      </PageShell>
    );
  }

  if (!canRead) {
    return <ReportForbiddenState />;
  }

  return (
    <PageShell data-testid="report-occurrences-page" width="wide">
      <PageHeader
        backHref="/reports"
        backLabel={REPORT_COPY.hubTitle}
        eyebrow="RELATÓRIO DE OCORRÊNCIAS"
        icon={OctagonAlert}
        subtitle={`${activeOrganization?.name ?? "Organização"} · ${items.length} registros nesta página`}
        title={REPORT_COPY.occurrences}
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <ReportSummaryKpiCard
          description={REPORT_COPY.onThisPage}
          isLoading={query.isLoading}
          label={`${REPORT_COPY.onThisPage}: total`}
          value={summary.totalRows}
        />
        <ReportSummaryKpiCard
          description={REPORT_COPY.onThisPage}
          icon={ShieldAlert}
          isLoading={query.isLoading}
          label={`${REPORT_COPY.onThisPage}: interdições ativas`}
          tone="destructive"
          value={summary.activeInterdictionsCount}
        />
      </section>

      <FilterShell
        actions={
          <>
            {hasDiscovery ? (
              <Button
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleClearFilters}
                size="sm"
                type="button"
                variant="ghost"
              >
                {REPORT_COPY.clearFilters}
              </Button>
            ) : null}
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
          </>
        }
        meta={
          activeFilterCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {activeFilterCount} {activeFilterCount === 1 ? "filtro ativo" : "filtros ativos"}
            </span>
          ) : null
        }
        title="Filtros e busca"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <ReportPeriodFilter
              activePreset={viewState.periodPreset}
              onChange={handlePeriodChange}
            />
            <OccurrenceReportFiltersDialog
              activeFilterCount={activeFilterCount}
              filters={viewState}
              onApply={replaceViewState}
            />
          </div>

          <label className="flex max-w-md flex-col gap-1.5 text-sm">
            <span className="text-xs font-medium text-muted-foreground">
              {REPORT_COPY.searchByCode}
            </span>
            <Input
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

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              checked={viewState.showOptionalColumns}
              className="accent-primary"
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

          {hasDiscovery ? (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {DASHBOARD_PERIOD_PRESETS.map((preset) =>
                viewState.periodPreset === preset.id ? (
                  <span key={preset.id} className="rounded-full border border-border px-2 py-1">
                    Período: {preset.label}
                  </span>
                ) : null,
              )}
              {viewState.status.map((status) => (
                <span key={status} className="rounded-full border border-border px-2 py-1">
                  Status: {formatOccurrenceStatus(status)}
                </span>
              ))}
              {viewState.severity.map((severity) => (
                <span key={severity} className="rounded-full border border-border px-2 py-1">
                  Criticidade: {formatOccurrenceSeverity(severity)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </FilterShell>

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
            variant={hasDiscovery ? "no-results" : "empty"}
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
    </PageShell>
  );
}

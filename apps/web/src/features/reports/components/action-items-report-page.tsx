"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { computeActionItemReportSummary, type ActionItemReportSortField } from "@safestop/types";

import { AlarmClock, Clock, ListChecks } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { useAuthorization } from "@/features/authorization";
import { useActiveOrganization } from "@/features/organization/hooks/use-active-organization";
import type { DashboardPeriodPresetId } from "@/features/dashboard/components/utils/period-presets";
import { DASHBOARD_PERIOD_PRESETS } from "@/features/dashboard/components/utils/period-presets";
import { formatActionItemStatus } from "@/features/action-plan/utils/format-labels";

import { ActionItemReportFiltersDialog } from "./action-item-report-filters-dialog";
import { ActionItemsReportTable } from "./action-items-report-table";
import { useActionItemsReport } from "../hooks/use-action-items-report";
import { useReportExport } from "../hooks/use-report-export";
import { useReportPagination } from "../hooks/use-report-pagination";
import { exportActionItemsReportCsv } from "../services/export-action-items-csv";
import { exportActionItemsReportXlsx } from "../services/export-action-items-xlsx";
import {
  actionItemViewStateToFilters,
  actionItemViewStateToSort,
  emptyActionItemReportViewState,
  hasActiveActionItemReportFilters,
  parseActionItemReportViewState,
  serializeActionItemReportViewState,
  type ActionItemReportViewState,
} from "../utils/action-item-report-url";
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

const REPORTS_SHELL_CLASS = "flex w-full flex-1 flex-col gap-6 px-6 py-10";

function countActionItemActiveFilters(state: ActionItemReportViewState): number {
  let count = 0;

  if (state.responsibleMemberId) count += 1;
  if (state.status.length > 0) count += 1;
  if (state.overdueOnly) count += 1;
  if (state.dueSoonOnly) count += 1;

  return count;
}

export function ActionItemsReportPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can, isReady, isLoading: isAuthLoading } = useAuthorization();
  const { activeOrganization } = useActiveOrganization();

  const viewState = useMemo(() => parseActionItemReportViewState(searchParams), [searchParams]);

  const filters = useMemo(() => actionItemViewStateToFilters(viewState), [viewState]);
  const sort = useMemo(() => actionItemViewStateToSort(viewState), [viewState]);

  const { pagination, canGoPrevious, resetPagination, goNext, goPrevious } = useReportPagination();

  const canRead = can("report.read");
  const query = useActionItemsReport(filters, sort, pagination, canRead && isReady);
  const { isExporting, exportError, runExport, clearExportError } = useReportExport();

  const replaceViewState = useCallback(
    (next: ActionItemReportViewState) => {
      router.replace(`${pathname}${serializeActionItemReportViewState(next)}`);
      resetPagination();
    },
    [pathname, resetPagination, router],
  );

  useEffect(() => {
    resetPagination();
  }, [searchParams, resetPagination]);

  const summary = useMemo(
    () =>
      computeActionItemReportSummary(query.data?.items ?? [], new Date(), viewState.dueSoonDays),
    [query.data?.items, viewState.dueSoonDays],
  );

  const activeFilters = hasActiveActionItemReportFilters(viewState);
  const activeFilterCount = countActionItemActiveFilters(viewState);
  const items = query.data?.items ?? [];
  const hasNext = query.data?.hasNext ?? false;

  function handleSort(field: ActionItemReportSortField) {
    const nextDirection =
      viewState.sortField === field && viewState.sortDirection === "asc" ? "desc" : "asc";

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
    replaceViewState(emptyActionItemReportViewState());
  }

  if (isAuthLoading || !isReady) {
    return (
      <main className={REPORTS_SHELL_CLASS}>
        <PageHeader
          backHref="/reports"
          backLabel={REPORT_COPY.hubTitle}
          title={REPORT_COPY.actionItems}
          icon={ListChecks}
        />
        <ReportPageSkeleton />
      </main>
    );
  }

  if (!canRead) {
    return <ReportForbiddenState />;
  }

  return (
    <main className={REPORTS_SHELL_CLASS} data-testid="report-action-items-page">
      <PageHeader
        backHref="/reports"
        backLabel={REPORT_COPY.hubTitle}
        subtitle={`${activeOrganization?.name ?? "Organização"} · ${items.length} registros nesta página`}
        title={REPORT_COPY.actionItems}
        icon={ListChecks}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ReportSummaryKpiCard
          isLoading={query.isLoading}
          label={`${REPORT_COPY.onThisPage}: total`}
          description={REPORT_COPY.onThisPage}
          value={summary.totalRows}
        />
        <ReportSummaryKpiCard
          isLoading={query.isLoading}
          label="Vencidas"
          description={REPORT_COPY.onThisPage}
          tone="destructive"
          icon={AlarmClock}
          value={summary.overdueCount}
        />
        <ReportSummaryKpiCard
          isLoading={query.isLoading}
          label="Próximas do vencimento"
          description={REPORT_COPY.onThisPage}
          tone="warning"
          icon={Clock}
          value={summary.dueSoonCount}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <ReportPeriodFilter activePreset={viewState.periodPreset} onChange={handlePeriodChange} />
          <div className="flex flex-wrap items-center gap-2">
            <ActionItemReportFiltersDialog
              activeFilterCount={activeFilterCount}
              filters={viewState}
              onApply={replaceViewState}
            />
            <ReportExportMenu
              isExporting={isExporting}
              onExportCsv={() => {
                void runExport(() =>
                  exportActionItemsReportCsv(query.organizationId, filters, sort),
                );
              }}
              onExportXlsx={() => {
                void runExport(() =>
                  exportActionItemsReportXlsx(query.organizationId, filters, sort),
                );
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
          {activeFilters ? (
            <Button
              className="h-auto px-0"
              size="sm"
              type="button"
              variant="link"
              onClick={handleClearFilters}
            >
              {REPORT_COPY.clearFilters}
            </Button>
          ) : null}
        </div>

        {activeFilters ? (
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
                Status: {formatActionItemStatus(status)}
              </span>
            ))}
            {viewState.overdueOnly ? (
              <span className="rounded-full border border-border px-2 py-1">Vencidas</span>
            ) : null}
            {viewState.dueSoonOnly ? (
              <span className="rounded-full border border-border px-2 py-1">
                Próximas do vencimento
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
            <ActionItemsReportTable
              caption={`Relatório de ${REPORT_COPY.actionItems}`}
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

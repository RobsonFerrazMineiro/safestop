"use client";

import { useEffect, useRef } from "react";

import {
  formatOccurrenceSeverity,
  formatOccurrenceStatus,
} from "@/features/occurrences/utils/format-labels";

import { useReportScopeFilterOptions } from "../hooks/use-report-scope-filter-options";
import { REPORT_COPY } from "../utils/report-copy";
import type { OccurrenceReportViewState } from "../utils/occurrence-report-url";
import {
  OCCURRENCE_SEVERITY_OPTIONS,
  OCCURRENCE_STATUS_OPTIONS,
} from "../utils/occurrence-report-url";

type OccurrenceReportFiltersDialogProps = {
  filters: OccurrenceReportViewState;
  activeFilterCount: number;
  onApply: (filters: OccurrenceReportViewState) => void;
};

function formatContractLabel(name: string, contractNumber: string | null): string {
  return contractNumber ? `${name} (${contractNumber})` : name;
}

function toggleArrayValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function OccurrenceReportFiltersDialog({
  filters,
  activeFilterCount,
  onApply,
}: OccurrenceReportFiltersDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { areas, contracts, contractors, isLoading, isError } = useReportScopeFilterOptions();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const handleClose = () => {
      document.body.style.overflow = "";
    };

    dialog.addEventListener("close", handleClose);

    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, []);

  function openDialog() {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    document.body.style.overflow = "hidden";
    dialog.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  function update(partial: Partial<OccurrenceReportViewState>) {
    onApply({ ...filters, ...partial });
  }

  return (
    <>
      <button
        className={`rounded-full border px-3 py-1.5 text-sm transition ${
          activeFilterCount > 0
            ? "border-orange-500 bg-orange-500/10 text-orange-200"
            : "border-gray-700 text-gray-300 hover:border-gray-500"
        }`}
        type="button"
        onClick={openDialog}
      >
        {REPORT_COPY.filters}
        {activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="occurrence-report-filters-title"
        className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/70"
      >
        <form
          className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-5"
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            closeDialog();
          }}
        >
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold" id="occurrence-report-filters-title">
                {REPORT_COPY.filters}
              </h2>
              <p className="text-xs text-gray-400">Escopo, status e criticidade do relatório.</p>
            </div>
            <button
              aria-label="Fechar filtros"
              className="rounded-md border border-gray-700 px-2 py-1 text-sm text-gray-300 hover:bg-gray-800"
              type="button"
              onClick={closeDialog}
            >
              ✕
            </button>
          </header>

          {isLoading ? <p className="text-sm text-gray-500">Carregando opções…</p> : null}
          {isError ? (
            <p className="text-sm text-red-300">Não foi possível carregar as opções de filtro.</p>
          ) : null}

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-400">Área</span>
            <select
              className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
              value={filters.areaId ?? ""}
              onChange={(event) => {
                update({ areaId: event.target.value || null });
              }}
            >
              <option value="">Todas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-400">Contrato</span>
            <select
              className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
              value={filters.contractId ?? ""}
              onChange={(event) => {
                update({ contractId: event.target.value || null });
              }}
            >
              <option value="">Todos</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {formatContractLabel(contract.name, contract.contractNumber)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-400">Contratada</span>
            <select
              className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
              value={filters.contractorOrganizationId ?? ""}
              onChange={(event) => {
                update({ contractorOrganizationId: event.target.value || null });
              }}
            >
              <option value="">Todas</option>
              {contractors.map((contractor) => (
                <option key={contractor.id} value={contractor.id}>
                  {contractor.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm text-gray-400">Status</legend>
            <div className="flex flex-wrap gap-2">
              {OCCURRENCE_STATUS_OPTIONS.map((status) => {
                const selected = filters.status.includes(status);

                return (
                  <button
                    key={status}
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      selected
                        ? "border-orange-500 bg-orange-500/10 text-orange-200"
                        : "border-gray-700 text-gray-300"
                    }`}
                    type="button"
                    onClick={() => {
                      update({ status: toggleArrayValue(filters.status, status) });
                    }}
                  >
                    {formatOccurrenceStatus(status)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm text-gray-400">Criticidade</legend>
            <div className="flex flex-wrap gap-2">
              {OCCURRENCE_SEVERITY_OPTIONS.map((severity) => {
                const selected = filters.severity.includes(severity);

                return (
                  <button
                    key={severity}
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      selected
                        ? "border-orange-500 bg-orange-500/10 text-orange-200"
                        : "border-gray-700 text-gray-300"
                    }`}
                    type="button"
                    onClick={() => {
                      update({ severity: toggleArrayValue(filters.severity, severity) });
                    }}
                  >
                    {formatOccurrenceSeverity(severity)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-400">Referência IMS</span>
            <select
              className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
              value={filters.hasIms === null ? "all" : filters.hasIms ? "with" : "without"}
              onChange={(event) => {
                const value = event.target.value;

                update({
                  hasIms: value === "all" ? null : value === "with",
                });
              }}
            >
              <option value="all">Todos</option>
              <option value="with">Com IMS</option>
              <option value="without">Sem IMS</option>
            </select>
          </label>
        </form>
      </dialog>
    </>
  );
}

"use client";

import { useEffect, useRef } from "react";

import type { DashboardScopeFilters } from "../types/scope-filters";
import {
  EMPTY_DASHBOARD_SCOPE_FILTERS,
  hasActiveDashboardScopeFilters,
} from "../types/scope-filters";
import { useDashboardScopeFilterOptions } from "../hooks/use-dashboard-scope-filter-options";

type DashboardScopeFiltersPanelProps = {
  filters: DashboardScopeFilters;
  onChange: (filters: DashboardScopeFilters) => void;
};

function formatContractLabel(name: string, contractNumber: string | null): string {
  return contractNumber ? `${name} (${contractNumber})` : name;
}

export function DashboardScopeFiltersPanel({ filters, onChange }: DashboardScopeFiltersPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { areas, contracts, contractors, isLoading, isError } = useDashboardScopeFilterOptions();
  const active = hasActiveDashboardScopeFilters(filters);

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

  function clearFilters() {
    onChange(EMPTY_DASHBOARD_SCOPE_FILTERS);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={`rounded-full border px-3 py-1.5 text-sm transition ${
            active
              ? "border-orange-500 bg-orange-500/10 text-orange-200"
              : "border-gray-700 text-gray-300 hover:border-gray-500"
          }`}
          type="button"
          onClick={openDialog}
        >
          Filtros locais{active ? " · ativos" : ""}
        </button>
        {active ? (
          <button
            className="text-sm text-orange-400 hover:text-orange-300"
            type="button"
            onClick={clearFilters}
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="dashboard-scope-filters-title"
        className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-0 text-gray-100 backdrop:bg-black/70"
      >
        <form
          className="flex flex-col gap-4 p-5"
          method="dialog"
          onSubmit={(event) => {
            event.preventDefault();
            closeDialog();
          }}
        >
          <header className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold" id="dashboard-scope-filters-title">
                Filtros locais
              </h2>
              <p className="text-xs text-gray-400">
                Afetam KPIs de ocorrência, listas e distribuições no escopo selecionado.
              </p>
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
            <p className="text-sm text-red-300" role="alert">
              Não foi possível carregar as opções de filtro.
            </p>
          ) : null}

          {!isLoading && !isError ? (
            <>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-gray-200">Área</span>
                <select
                  className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
                  value={filters.areaId ?? ""}
                  onChange={(event) => {
                    onChange({
                      ...filters,
                      areaId: event.target.value.length > 0 ? event.target.value : null,
                    });
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

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-gray-200">Contrato</span>
                <select
                  className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
                  value={filters.contractId ?? ""}
                  onChange={(event) => {
                    onChange({
                      ...filters,
                      contractId: event.target.value.length > 0 ? event.target.value : null,
                    });
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

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-gray-200">Contratada</span>
                <select
                  className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
                  value={filters.contractorOrganizationId ?? ""}
                  onChange={(event) => {
                    onChange({
                      ...filters,
                      contractorOrganizationId:
                        event.target.value.length > 0 ? event.target.value : null,
                    });
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
            </>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            {active ? (
              <button
                className="rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"
                type="button"
                onClick={() => {
                  clearFilters();
                }}
              >
                Limpar filtros
              </button>
            ) : null}
            <button
              className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-400"
              type="submit"
            >
              Aplicar
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

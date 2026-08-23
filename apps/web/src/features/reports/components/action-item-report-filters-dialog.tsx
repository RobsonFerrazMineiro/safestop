"use client";

import { useEffect, useRef } from "react";
import type { ActionItemStatus } from "@safestop/types";
import { DASHBOARD_DUE_SOON_DAYS_DEFAULT } from "@safestop/types";

import { formatActionItemStatus } from "@/features/action-plan/utils/format-labels";

import { useReportScopeFilterOptions } from "../hooks/use-report-scope-filter-options";
import { REPORT_COPY } from "../utils/report-copy";
import type { ActionItemReportViewState } from "../utils/action-item-report-url";
import { ACTION_ITEM_STATUS_OPTIONS } from "../utils/action-item-report-url";

type ActionItemReportFiltersDialogProps = {
  filters: ActionItemReportViewState;
  activeFilterCount: number;
  onApply: (filters: ActionItemReportViewState) => void;
};

function toggleArrayValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function ActionItemReportFiltersDialog({
  filters,
  activeFilterCount,
  onApply,
}: ActionItemReportFiltersDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { members, isLoading, isError } = useReportScopeFilterOptions();

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

  function update(partial: Partial<ActionItemReportViewState>) {
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
        aria-labelledby="action-item-report-filters-title"
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
              <h2 className="text-lg font-semibold" id="action-item-report-filters-title">
                {REPORT_COPY.filters}
              </h2>
              <p className="text-xs text-gray-400">Status, prazo e responsável.</p>
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
            <span className="text-gray-400">Responsável</span>
            <select
              className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
              value={filters.responsibleMemberId ?? ""}
              onChange={(event) => {
                update({ responsibleMemberId: event.target.value || null });
              }}
            >
              <option value="">Todos</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName ?? member.id}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm text-gray-400">Status</legend>
            <div className="flex flex-wrap gap-2">
              {ACTION_ITEM_STATUS_OPTIONS.map((status) => {
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
                      update({
                        status: toggleArrayValue(filters.status, status as ActionItemStatus),
                      });
                    }}
                  >
                    {formatActionItemStatus(status)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <button
              className={`rounded-full border px-3 py-1.5 text-sm ${
                filters.overdueOnly
                  ? "border-orange-500 bg-orange-500/10 text-orange-200"
                  : "border-gray-700 text-gray-300"
              }`}
              type="button"
              onClick={() => {
                update({ overdueOnly: !filters.overdueOnly });
              }}
            >
              Vencidas
            </button>
            <button
              className={`rounded-full border px-3 py-1.5 text-sm ${
                filters.dueSoonOnly
                  ? "border-orange-500 bg-orange-500/10 text-orange-200"
                  : "border-gray-700 text-gray-300"
              }`}
              type="button"
              onClick={() => {
                update({ dueSoonOnly: !filters.dueSoonOnly });
              }}
            >
              Próximas do vencimento
            </button>
          </div>

          {filters.dueSoonOnly ? (
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-400">Dias para vencimento próximo</span>
              <input
                className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
                max={30}
                min={1}
                type="number"
                value={filters.dueSoonDays}
                onChange={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10);
                  update({
                    dueSoonDays:
                      Number.isFinite(parsed) && parsed >= 1 && parsed <= 30
                        ? parsed
                        : DASHBOARD_DUE_SOON_DAYS_DEFAULT,
                  });
                }}
              />
            </label>
          ) : null}
        </form>
      </dialog>
    </>
  );
}

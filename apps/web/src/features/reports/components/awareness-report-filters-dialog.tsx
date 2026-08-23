"use client";

import { useEffect, useRef } from "react";

import { useReportScopeFilterOptions } from "../hooks/use-report-scope-filter-options";
import { REPORT_COPY } from "../utils/report-copy";
import type { AwarenessReportViewState } from "../utils/awareness-report-url";

type AwarenessReportFiltersDialogProps = {
  filters: AwarenessReportViewState;
  activeFilterCount: number;
  onApply: (filters: AwarenessReportViewState) => void;
};

export function AwarenessReportFiltersDialog({
  filters,
  activeFilterCount,
  onApply,
}: AwarenessReportFiltersDialogProps) {
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

  function update(partial: Partial<AwarenessReportViewState>) {
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
        aria-labelledby="awareness-report-filters-title"
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
              <h2 className="text-lg font-semibold" id="awareness-report-filters-title">
                {REPORT_COPY.filters}
              </h2>
              <p className="text-xs text-gray-400">Destinatário e pendências de ciência.</p>
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
            <span className="text-gray-400">Destinatário</span>
            <select
              className="rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100"
              value={filters.recipientMemberId ?? ""}
              onChange={(event) => {
                update({ recipientMemberId: event.target.value || null });
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

          <button
            className={`self-start rounded-full border px-3 py-1.5 text-sm ${
              filters.pendingOnly
                ? "border-orange-500 bg-orange-500/10 text-orange-200"
                : "border-gray-700 text-gray-300"
            }`}
            type="button"
            onClick={() => {
              update({ pendingOnly: !filters.pendingOnly });
            }}
          >
            Somente pendentes de ciência
          </button>
        </form>
      </dialog>
    </>
  );
}

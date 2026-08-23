"use client";

import { useRouter } from "next/navigation";
import type { ActionItemReportRow, ActionItemReportSortField } from "@safestop/types";

import { formatActionItemStatus } from "@/features/action-plan/utils/format-labels";

import { formatReportDateTime } from "../utils/format-report-date";

type ActionItemsReportTableProps = {
  caption: string;
  rows: ActionItemReportRow[];
  sortField: ActionItemReportSortField;
  sortDirection: "asc" | "desc";
  showOptionalColumns: boolean;
  onSort: (field: ActionItemReportSortField) => void;
};

function sortIndicator(
  field: ActionItemReportSortField,
  activeField: ActionItemReportSortField,
  direction: "asc" | "desc",
): string {
  if (field !== activeField) {
    return "";
  }

  return direction === "asc" ? " ↑" : " ↓";
}

export function ActionItemsReportTable({
  caption,
  rows,
  sortField,
  sortDirection,
  showOptionalColumns,
  onSort,
}: ActionItemsReportTableProps) {
  const router = useRouter();

  function handleRowNavigate(occurrenceId: string) {
    router.push(`/stop-work/${occurrenceId}`);
  }

  function renderSortableHeader(label: string, field: ActionItemReportSortField) {
    const ariaSort =
      sortField === field ? (sortDirection === "asc" ? "ascending" : "descending") : "none";

    return (
      <th aria-sort={ariaSort} className="px-4 py-3" scope="col">
        <button
          className="text-left uppercase tracking-wide hover:text-gray-200"
          type="button"
          onClick={() => {
            onSort(field);
          }}
        >
          {label}
          {sortIndicator(field, sortField, sortDirection)}
        </button>
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-800">
      <table className="min-w-full divide-y divide-gray-800 text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-gray-950/70 text-left text-xs uppercase tracking-wide text-gray-400">
          <tr>
            {renderSortableHeader("Título", "title")}
            {renderSortableHeader("Prazo", "due_at")}
            {renderSortableHeader("Status", "status")}
            <th className="px-4 py-3" scope="col">
              Vencida
            </th>
            <th className="px-4 py-3" scope="col">
              Próx. vencimento
            </th>
            {showOptionalColumns ? (
              <th className="px-4 py-3" scope="col">
                Responsável
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {rows.map((row) => {
            const navigable = row.occurrenceId.length > 0;

            return (
              <tr
                key={row.id}
                className={`bg-gray-900/30 ${navigable ? "cursor-pointer hover:bg-gray-900/60" : ""}`}
                tabIndex={navigable ? 0 : undefined}
                onClick={
                  navigable
                    ? () => {
                        handleRowNavigate(row.occurrenceId);
                      }
                    : undefined
                }
                onKeyDown={
                  navigable
                    ? (event) => {
                        if (event.key === "Enter") {
                          handleRowNavigate(row.occurrenceId);
                        }
                      }
                    : undefined
                }
              >
                <td className="px-4 py-3 text-gray-100">{row.title}</td>
                <td className="px-4 py-3 text-gray-300">{formatReportDateTime(row.dueAt)}</td>
                <td className="px-4 py-3 text-gray-200">{formatActionItemStatus(row.status)}</td>
                <td className="px-4 py-3">
                  {row.isOverdue ? (
                    <span className="rounded-full border border-red-800/60 px-2 py-0.5 text-xs text-red-300">
                      Vencida
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.isDueSoon ? (
                    <span className="rounded-full border border-amber-700/50 px-2 py-0.5 text-xs text-amber-200">
                      Próxima
                    </span>
                  ) : (
                    <span className="text-gray-500">—</span>
                  )}
                </td>
                {showOptionalColumns ? (
                  <td className="px-4 py-3 text-gray-300">{row.responsibleMemberName ?? "—"}</td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

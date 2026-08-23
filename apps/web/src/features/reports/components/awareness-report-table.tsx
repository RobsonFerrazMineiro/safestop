"use client";

import { useRouter } from "next/navigation";
import type { AwarenessReportRow, AwarenessReportSortField } from "@safestop/types";
import { requiresNotificationAwareness } from "@safestop/types";

import { formatNotificationEventType } from "../utils/format-notification-event-type";
import { formatReportDateTime } from "../utils/format-report-date";
import { REPORT_COPY } from "../utils/report-copy";

type AwarenessReportTableProps = {
  caption: string;
  rows: AwarenessReportRow[];
  sortField: AwarenessReportSortField;
  sortDirection: "asc" | "desc";
  showOptionalColumns: boolean;
  onSort: (field: AwarenessReportSortField) => void;
};

function sortIndicator(
  field: AwarenessReportSortField,
  activeField: AwarenessReportSortField,
  direction: "asc" | "desc",
): string {
  if (field !== activeField) {
    return "";
  }

  return direction === "asc" ? " ↑" : " ↓";
}

export function AwarenessReportTable({
  caption,
  rows,
  sortField,
  sortDirection,
  showOptionalColumns,
  onSort,
}: AwarenessReportTableProps) {
  const router = useRouter();

  function handleRowNavigate(occurrenceId: string) {
    router.push(`/stop-work/${occurrenceId}`);
  }

  function renderSortableHeader(label: string, field: AwarenessReportSortField) {
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
            {renderSortableHeader("Data", "created_at")}
            {renderSortableHeader("Tipo evento", "event_type")}
            <th className="px-4 py-3" scope="col">
              Destinatário
            </th>
            <th className="px-4 py-3" scope="col">
              Ciência
            </th>
            {showOptionalColumns ? (
              <>
                <th className="px-4 py-3" scope="col">
                  Exige ciência?
                </th>
                <th className="px-4 py-3" scope="col">
                  Leitura
                </th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {rows.map((row) => {
            const pending = requiresNotificationAwareness(row);
            const navigable = row.occurrenceId !== null && row.occurrenceId.length > 0;

            return (
              <tr
                key={row.id}
                className={`bg-gray-900/30 ${navigable ? "cursor-pointer hover:bg-gray-900/60" : ""}`}
                tabIndex={navigable ? 0 : undefined}
                onClick={
                  navigable && row.occurrenceId
                    ? () => {
                        handleRowNavigate(row.occurrenceId as string);
                      }
                    : undefined
                }
                onKeyDown={
                  navigable && row.occurrenceId
                    ? (event) => {
                        if (event.key === "Enter") {
                          handleRowNavigate(row.occurrenceId as string);
                        }
                      }
                    : undefined
                }
              >
                <td className="px-4 py-3 text-gray-300">{formatReportDateTime(row.createdAt)}</td>
                <td className="px-4 py-3 text-gray-200">
                  {formatNotificationEventType(row.eventType)}
                </td>
                <td className="px-4 py-3 text-gray-300">{row.recipientMemberName ?? "—"}</td>
                <td className="px-4 py-3">
                  {pending ? (
                    <span className="rounded-full border border-amber-700/50 px-2 py-0.5 text-xs text-amber-200">
                      Pendente
                    </span>
                  ) : (
                    <span className="text-gray-300">
                      Confirmada
                      {row.awarenessConfirmedAt
                        ? ` · ${formatReportDateTime(row.awarenessConfirmedAt)}`
                        : ""}
                    </span>
                  )}
                </td>
                {showOptionalColumns ? (
                  <>
                    <td className="px-4 py-3 text-gray-300">
                      {row.requiresAwareness ? "Sim" : "Não"}
                    </td>
                    <td className="px-4 py-3 text-gray-300" title={REPORT_COPY.awarenessReadHint}>
                      {row.readAt ? formatReportDateTime(row.readAt) : "—"}
                    </td>
                  </>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

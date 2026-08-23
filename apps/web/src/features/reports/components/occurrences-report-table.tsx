"use client";

import { useRouter } from "next/navigation";
import type { OccurrenceReportRow, OccurrenceReportSortField } from "@safestop/types";
import { DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS } from "@safestop/types";

import {
  formatOccurrenceSeverity,
  formatOccurrenceStatus,
} from "@/features/occurrences/utils/format-labels";

import { formatReportDateTime } from "../utils/format-report-date";

type OccurrencesReportTableProps = {
  caption: string;
  rows: OccurrenceReportRow[];
  sortField: OccurrenceReportSortField;
  sortDirection: "asc" | "desc";
  showOptionalColumns: boolean;
  onSort: (field: OccurrenceReportSortField) => void;
};

function sortIndicator(
  field: OccurrenceReportSortField,
  activeField: OccurrenceReportSortField,
  direction: "asc" | "desc",
): string {
  if (field !== activeField) {
    return "";
  }

  return direction === "asc" ? " ↑" : " ↓";
}

function formatContractLabel(row: OccurrenceReportRow): string {
  if (row.contractNumber && row.contractName) {
    return `${row.contractNumber} - ${row.contractName}`;
  }

  return row.contractNumber ?? row.contractName ?? "—";
}

export function OccurrencesReportTable({
  caption,
  rows,
  sortField,
  sortDirection,
  showOptionalColumns,
  onSort,
}: OccurrencesReportTableProps) {
  const router = useRouter();

  function handleRowNavigate(id: string) {
    router.push(`/stop-work/${id}`);
  }

  function renderSortableHeader(label: string, field: OccurrenceReportSortField) {
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
            {renderSortableHeader("Código", "public_code")}
            {renderSortableHeader("Data PP", "occurred_at")}
            {renderSortableHeader("Área", "area")}
            <th className="px-4 py-3" scope="col">
              Contrato
            </th>
            <th className="px-4 py-3" scope="col">
              Contratada
            </th>
            {renderSortableHeader("Status", "status")}
            <th className="px-4 py-3" scope="col">
              Família
            </th>
            {showOptionalColumns ? (
              <>
                {renderSortableHeader("Criticidade", "severity")}
                <th className="px-4 py-3" scope="col">
                  Decisão IO
                </th>
                <th className="px-4 py-3" scope="col">
                  IMS
                </th>
                <th className="px-4 py-3" scope="col">
                  Unidade
                </th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer bg-gray-900/30 hover:bg-gray-900/60"
              tabIndex={0}
              onClick={() => {
                handleRowNavigate(row.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleRowNavigate(row.id);
                }
              }}
            >
              <td className="px-4 py-3 font-medium text-orange-400">{row.publicCode}</td>
              <td className="px-4 py-3 text-gray-300">{formatReportDateTime(row.occurredAt)}</td>
              <td className="px-4 py-3 text-gray-300">{row.areaName ?? "—"}</td>
              <td className="px-4 py-3 text-gray-300">{formatContractLabel(row)}</td>
              <td className="px-4 py-3 text-gray-300">{row.contractorOrganizationName ?? "—"}</td>
              <td className="px-4 py-3 text-gray-200">{formatOccurrenceStatus(row.status)}</td>
              <td className="px-4 py-3 text-gray-300">
                {DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS[row.statusFamily]}
              </td>
              {showOptionalColumns ? (
                <>
                  <td className="px-4 py-3 text-gray-300">
                    {formatOccurrenceSeverity(row.severity)}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{row.decisionType ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-300">{row.imsReferenceCode ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-300">{row.unitName ?? "—"}</td>
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

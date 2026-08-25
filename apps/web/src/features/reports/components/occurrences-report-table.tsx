"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { tableFeatures, useTable, type ColumnDef } from "@tanstack/react-table";
import type { OccurrenceReportRow, OccurrenceReportSortField } from "@safestop/types";
import { DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS } from "@safestop/types";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatOccurrenceSeverity,
  formatOccurrenceStatus,
} from "@/features/occurrences/utils/format-labels";

import { formatReportDateTime } from "../utils/format-report-date";

const features = tableFeatures({});

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

function SortableHead({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
}: {
  label: string;
  field: OccurrenceReportSortField;
  sortField: OccurrenceReportSortField;
  sortDirection: "asc" | "desc";
  onSort: (field: OccurrenceReportSortField) => void;
}) {
  return (
    <Button
      className="h-auto px-0 text-left text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
      type="button"
      variant="ghost"
      onClick={() => {
        onSort(field);
      }}
    >
      {label}
      {sortIndicator(field, sortField, sortDirection)}
    </Button>
  );
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

  const columns = useMemo<Array<ColumnDef<typeof features, OccurrenceReportRow>>>(() => {
    const base: Array<ColumnDef<typeof features, OccurrenceReportRow>> = [
      {
        accessorKey: "publicCode",
        header: () => (
          <SortableHead
            field="public_code"
            label="Código"
            onSort={onSort}
            sortDirection={sortDirection}
            sortField={sortField}
          />
        ),
        cell: (info) => <span className="font-medium text-primary">{info.getValue<string>()}</span>,
      },
      {
        accessorKey: "occurredAt",
        header: () => (
          <SortableHead
            field="occurred_at"
            label="Data PP"
            onSort={onSort}
            sortDirection={sortDirection}
            sortField={sortField}
          />
        ),
        cell: (info) => formatReportDateTime(info.getValue<string>()),
      },
      {
        accessorKey: "areaName",
        header: () => (
          <SortableHead
            field="area"
            label="Área"
            onSort={onSort}
            sortDirection={sortDirection}
            sortField={sortField}
          />
        ),
        cell: (info) => info.getValue<string | null>() ?? "—",
      },
      {
        id: "contract",
        accessorFn: (row) => formatContractLabel(row),
        header: "Contrato",
      },
      {
        accessorKey: "contractorOrganizationName",
        header: "Contratada",
        cell: (info) => info.getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "status",
        header: () => (
          <SortableHead
            field="status"
            label="Status"
            onSort={onSort}
            sortDirection={sortDirection}
            sortField={sortField}
          />
        ),
        cell: (info) => formatOccurrenceStatus(info.row.original.status),
      },
      {
        accessorKey: "statusFamily",
        header: "Família",
        cell: (info) => DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS[info.row.original.statusFamily],
      },
    ];

    if (!showOptionalColumns) {
      return base;
    }

    return [
      ...base,
      {
        accessorKey: "severity",
        header: () => (
          <SortableHead
            field="severity"
            label="Criticidade"
            onSort={onSort}
            sortDirection={sortDirection}
            sortField={sortField}
          />
        ),
        cell: (info) => formatOccurrenceSeverity(info.row.original.severity),
      },
      {
        accessorKey: "decisionType",
        header: "Decisão IO",
        cell: (info) => info.getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "imsReferenceCode",
        header: "IMS",
        cell: (info) => info.getValue<string | null>() ?? "—",
      },
      {
        accessorKey: "unitName",
        header: "Unidade",
        cell: (info) => info.getValue<string | null>() ?? "—",
      },
    ];
  }, [onSort, showOptionalColumns, sortDirection, sortField]);

  const table = useTable({
    features,
    columns,
    data: rows,
  });

  function handleRowNavigate(id: string) {
    router.push(`/stop-work/${id}`);
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortFieldId = header.column.id;
                const ariaSortMap: Record<string, OccurrenceReportSortField> = {
                  publicCode: "public_code",
                  occurredAt: "occurred_at",
                  areaName: "area",
                  status: "status",
                  severity: "severity",
                };
                const mapped = ariaSortMap[sortFieldId];
                const ariaSort =
                  mapped && sortField === mapped
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none";

                return (
                  <TableHead aria-sort={ariaSort} className="px-4 py-3" key={header.id}>
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              className="cursor-pointer"
              key={row.id}
              tabIndex={0}
              onClick={() => {
                handleRowNavigate(row.original.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleRowNavigate(row.original.id);
                }
              }}
            >
              {row.getAllCells().map((cell) => (
                <TableCell className="px-4 py-3" key={cell.id}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { tableFeatures, useTable, type ColumnDef } from "@tanstack/react-table";
import type { ActionItemReportRow, ActionItemReportSortField } from "@safestop/types";

import { Badge } from "@/components/ui/badge";
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
import { formatActionItemStatus } from "@/features/action-plan/utils/format-labels";

import { formatReportDateTime } from "../utils/format-report-date";

const features = tableFeatures({});

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

function SortableHead({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
}: {
  label: string;
  field: ActionItemReportSortField;
  sortField: ActionItemReportSortField;
  sortDirection: "asc" | "desc";
  onSort: (field: ActionItemReportSortField) => void;
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

export function ActionItemsReportTable({
  caption,
  rows,
  sortField,
  sortDirection,
  showOptionalColumns,
  onSort,
}: ActionItemsReportTableProps) {
  const router = useRouter();

  const columns = useMemo<Array<ColumnDef<typeof features, ActionItemReportRow>>>(() => {
    const base: Array<ColumnDef<typeof features, ActionItemReportRow>> = [
      {
        accessorKey: "title",
        header: () => (
          <SortableHead
            field="title"
            label="Título"
            onSort={onSort}
            sortDirection={sortDirection}
            sortField={sortField}
          />
        ),
      },
      {
        accessorKey: "dueAt",
        header: () => (
          <SortableHead
            field="due_at"
            label="Prazo"
            onSort={onSort}
            sortDirection={sortDirection}
            sortField={sortField}
          />
        ),
        cell: (info) => formatReportDateTime(info.getValue<string>()),
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
        cell: (info) => formatActionItemStatus(info.row.original.status),
      },
      {
        accessorKey: "isOverdue",
        header: "Vencida",
        cell: (info) =>
          info.getValue<boolean>() ? (
            <Badge className="border-red-800/60 bg-red-950/20 text-red-300" variant="outline">
              Vencida
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "isDueSoon",
        header: "Próx. vencimento",
        cell: (info) =>
          info.getValue<boolean>() ? (
            <Badge className="border-amber-700/50 bg-amber-950/20 text-amber-200" variant="outline">
              Próxima
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ];

    if (!showOptionalColumns) {
      return base;
    }

    return [
      ...base,
      {
        accessorKey: "responsibleMemberName",
        header: "Responsável",
        cell: (info) => info.getValue<string | null>() ?? "—",
      },
    ];
  }, [onSort, showOptionalColumns, sortDirection, sortField]);

  const table = useTable({
    features,
    columns,
    data: rows,
  });

  function handleRowNavigate(occurrenceId: string) {
    router.push(`/stop-work/${occurrenceId}`);
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableCaption className="sr-only">{caption}</TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const ariaSortMap: Record<string, ActionItemReportSortField> = {
                  title: "title",
                  dueAt: "due_at",
                  status: "status",
                };
                const mapped = ariaSortMap[header.column.id];
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
          {table.getRowModel().rows.map((row) => {
            const navigable = row.original.occurrenceId.length > 0;

            return (
              <TableRow
                className={navigable ? "cursor-pointer" : undefined}
                key={row.id}
                tabIndex={navigable ? 0 : undefined}
                onClick={
                  navigable
                    ? () => {
                        handleRowNavigate(row.original.occurrenceId);
                      }
                    : undefined
                }
                onKeyDown={
                  navigable
                    ? (event) => {
                        if (event.key === "Enter") {
                          handleRowNavigate(row.original.occurrenceId);
                        }
                      }
                    : undefined
                }
              >
                {row.getAllCells().map((cell) => (
                  <TableCell className="px-4 py-3" key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

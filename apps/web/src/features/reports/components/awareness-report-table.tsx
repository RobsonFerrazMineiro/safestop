"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { tableFeatures, useTable, type ColumnDef } from "@tanstack/react-table";
import type { AwarenessReportRow, AwarenessReportSortField } from "@safestop/types";
import { requiresNotificationAwareness } from "@safestop/types";

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

import { formatNotificationEventType } from "../utils/format-notification-event-type";
import { formatReportDateTime } from "../utils/format-report-date";
import { REPORT_COPY } from "../utils/report-copy";

const features = tableFeatures({});

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

function SortableHead({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
}: {
  label: string;
  field: AwarenessReportSortField;
  sortField: AwarenessReportSortField;
  sortDirection: "asc" | "desc";
  onSort: (field: AwarenessReportSortField) => void;
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

export function AwarenessReportTable({
  caption,
  rows,
  sortField,
  sortDirection,
  showOptionalColumns,
  onSort,
}: AwarenessReportTableProps) {
  const router = useRouter();

  const columns = useMemo<Array<ColumnDef<typeof features, AwarenessReportRow>>>(() => {
    const base: Array<ColumnDef<typeof features, AwarenessReportRow>> = [
      {
        accessorKey: "createdAt",
        header: () => (
          <SortableHead
            field="created_at"
            label="Data"
            onSort={onSort}
            sortDirection={sortDirection}
            sortField={sortField}
          />
        ),
        cell: (info) => formatReportDateTime(info.getValue<string>()),
      },
      {
        accessorKey: "eventType",
        header: () => (
          <SortableHead
            field="event_type"
            label="Tipo evento"
            onSort={onSort}
            sortDirection={sortDirection}
            sortField={sortField}
          />
        ),
        cell: (info) => formatNotificationEventType(info.row.original.eventType),
      },
      {
        accessorKey: "recipientMemberName",
        header: "Destinatário",
        cell: (info) => info.getValue<string | null>() ?? "—",
      },
      {
        id: "awareness",
        header: "Ciência",
        cell: (info) => {
          const row = info.row.original;
          const pending = requiresNotificationAwareness(row);

          if (pending) {
            return (
              <Badge
                className="border-amber-700/50 bg-amber-950/20 text-amber-200"
                variant="outline"
              >
                Pendente
              </Badge>
            );
          }

          return (
            <span>
              Confirmada
              {row.awarenessConfirmedAt
                ? ` · ${formatReportDateTime(row.awarenessConfirmedAt)}`
                : ""}
            </span>
          );
        },
      },
    ];

    if (!showOptionalColumns) {
      return base;
    }

    return [
      ...base,
      {
        accessorKey: "requiresAwareness",
        header: "Exige ciência?",
        cell: (info) => (info.getValue<boolean>() ? "Sim" : "Não"),
      },
      {
        accessorKey: "readAt",
        header: "Leitura",
        cell: (info) => (
          <span title={REPORT_COPY.awarenessReadHint}>
            {info.row.original.readAt ? formatReportDateTime(info.row.original.readAt) : "—"}
          </span>
        ),
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
                const ariaSortMap: Record<string, AwarenessReportSortField> = {
                  createdAt: "created_at",
                  eventType: "event_type",
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
            const occurrenceId = row.original.occurrenceId;
            const navigable = occurrenceId !== null && occurrenceId.length > 0;

            return (
              <TableRow
                className={navigable ? "cursor-pointer" : undefined}
                key={row.id}
                tabIndex={navigable ? 0 : undefined}
                onClick={
                  navigable && occurrenceId
                    ? () => {
                        handleRowNavigate(occurrenceId);
                      }
                    : undefined
                }
                onKeyDown={
                  navigable && occurrenceId
                    ? (event) => {
                        if (event.key === "Enter") {
                          handleRowNavigate(occurrenceId);
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

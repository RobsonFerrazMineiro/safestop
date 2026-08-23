import type { AwarenessReportRow } from "@safestop/types";

import { formatCsvDate } from "./csv";
import type { Column } from "./xlsx";

const XLSX_DATE_FORMAT = "dd/mm/yyyy";

function toXlsxDate(isoTimestamp: string | null): Date | undefined {
  if (!isoTimestamp) {
    return undefined;
  }

  const date = new Date(isoTimestamp);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatBoolean(value: boolean): string {
  return value ? "Sim" : "Não";
}

/**
 * Colunas do Relatório de Ciência (matriz BACKEND anexada em
 * REPORTS-DECISIONS.md — adendo desta sprint). Leitura (`readAt`) ≠ ciência
 * (`awarenessConfirmedAt`) — nunca tratar como sinônimos (docs/notifications.md).
 */
export const AWARENESS_REPORT_CSV_HEADERS = [
  "Data",
  "Tipo de evento",
  "Destinatário",
  "Requer ciência",
  "Lido em",
  "Ciência confirmada em",
  "ID da Ocorrência",
  "ID do Evento de Notificação",
] as const;

export function awarenessReportRowToCsvCells(row: AwarenessReportRow): string[] {
  return [
    formatCsvDate(row.createdAt),
    row.eventType,
    row.recipientMemberName ?? "",
    formatBoolean(row.requiresAwareness),
    formatCsvDate(row.readAt),
    formatCsvDate(row.awarenessConfirmedAt),
    row.occurrenceId ?? "",
    row.notificationEventId,
  ];
}

export const AWARENESS_REPORT_XLSX_COLUMNS: Column<AwarenessReportRow>[] = [
  {
    header: "Data",
    cell: (row) => ({ value: toXlsxDate(row.createdAt), type: Date, format: XLSX_DATE_FORMAT }),
  },
  { header: "Tipo de evento", cell: (row) => ({ value: row.eventType }) },
  { header: "Destinatário", cell: (row) => ({ value: row.recipientMemberName ?? "" }) },
  { header: "Requer ciência", cell: (row) => ({ value: row.requiresAwareness }) },
  {
    header: "Lido em",
    cell: (row) => ({ value: toXlsxDate(row.readAt), type: Date, format: XLSX_DATE_FORMAT }),
  },
  {
    header: "Ciência confirmada em",
    cell: (row) => ({
      value: toXlsxDate(row.awarenessConfirmedAt),
      type: Date,
      format: XLSX_DATE_FORMAT,
    }),
  },
  { header: "ID da Ocorrência", cell: (row) => ({ value: row.occurrenceId ?? "" }) },
  { header: "ID do Evento de Notificação", cell: (row) => ({ value: row.notificationEventId }) },
];

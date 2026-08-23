import type { ActionItemReportRow } from "@safestop/types";

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
 * Colunas do Relatório de Plano de Ação (matriz BACKEND anexada em
 * REPORTS-DECISIONS.md — adendo desta sprint). `id` (próprio) fica fora da
 * exportação (sem valor de leitura humana); `occurrenceId`/`actionPlanId`
 * são export-only, mantidos para correlação entre relatórios — a RPC
 * `list_action_items_report` não retorna `public_code` da ocorrência
 * (limitação conhecida, registrada no relatório final do handoff).
 */
export const ACTION_ITEM_REPORT_CSV_HEADERS = [
  "Título",
  "Prazo",
  "Status",
  "Vencida",
  "Próxima do vencimento",
  "Responsável",
  "ID da Ocorrência",
  "ID do Plano de Ação",
  "Concluída em",
  "Validada em",
] as const;

export function actionItemReportRowToCsvCells(row: ActionItemReportRow): string[] {
  return [
    row.title,
    formatCsvDate(row.dueAt),
    row.status,
    formatBoolean(row.isOverdue),
    formatBoolean(row.isDueSoon),
    row.responsibleMemberName ?? "",
    row.occurrenceId,
    row.actionPlanId,
    formatCsvDate(row.completedAt),
    formatCsvDate(row.validatedAt),
  ];
}

export const ACTION_ITEM_REPORT_XLSX_COLUMNS: Column<ActionItemReportRow>[] = [
  { header: "Título", cell: (row) => ({ value: row.title }) },
  {
    header: "Prazo",
    cell: (row) => ({ value: toXlsxDate(row.dueAt), type: Date, format: XLSX_DATE_FORMAT }),
  },
  { header: "Status", cell: (row) => ({ value: row.status }) },
  { header: "Vencida", cell: (row) => ({ value: row.isOverdue }) },
  { header: "Próxima do vencimento", cell: (row) => ({ value: row.isDueSoon }) },
  { header: "Responsável", cell: (row) => ({ value: row.responsibleMemberName ?? "" }) },
  { header: "ID da Ocorrência", cell: (row) => ({ value: row.occurrenceId }) },
  { header: "ID do Plano de Ação", cell: (row) => ({ value: row.actionPlanId }) },
  {
    header: "Concluída em",
    cell: (row) => ({ value: toXlsxDate(row.completedAt), type: Date, format: XLSX_DATE_FORMAT }),
  },
  {
    header: "Validada em",
    cell: (row) => ({ value: toXlsxDate(row.validatedAt), type: Date, format: XLSX_DATE_FORMAT }),
  },
];

import type { OccurrenceReportRow } from "@safestop/types";
import { DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS } from "@safestop/types";

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

/**
 * Colunas do Relatório de Ocorrências para exportação (CSV e XLSX),
 * derivadas da matriz de colunas consolidada (REPORTS-DECISIONS.md,
 * PO-REP-3). `id`/`areaId`/`contractId`/`contractorOrganizationId`/`unitId`/
 * `managementDepartmentId` (uuids técnicos) ficam FORA da exportação — a
 * matriz só lista campos com valor de leitura humana.
 */
export const OCCURRENCE_REPORT_CSV_HEADERS = [
  "Código",
  "Data da PP",
  "Área",
  "Contrato",
  "Contratada executante",
  "Status",
  "Família",
  "Severidade",
  "Situação da Interdição Oficial",
  "Referência IMS",
  "Unidade",
  "Gerência",
  "Parado em",
  "Avaliado em",
  "Liberado em",
  "Encerrado em",
  "Cancelado em",
  "Motivo do cancelamento",
  "Registrado por",
  "Avaliador responsável",
] as const;

function formatContractLabel(row: OccurrenceReportRow): string {
  if (row.contractNumber && row.contractName) {
    return `${row.contractNumber} - ${row.contractName}`;
  }

  return row.contractNumber ?? row.contractName ?? "";
}

export function occurrenceReportRowToCsvCells(row: OccurrenceReportRow): string[] {
  return [
    row.publicCode,
    formatCsvDate(row.occurredAt),
    row.areaName ?? "",
    formatContractLabel(row),
    row.contractorOrganizationName ?? "",
    row.status,
    DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS[row.statusFamily],
    row.severity,
    row.decisionType ?? "",
    row.imsReferenceCode ?? "",
    row.unitName ?? "",
    row.managementDepartmentName ?? "",
    formatCsvDate(row.stoppedAt),
    formatCsvDate(row.evaluatedAt),
    formatCsvDate(row.releasedAt),
    formatCsvDate(row.closedAt),
    formatCsvDate(row.cancelledAt),
    row.cancellationReason ?? "",
    row.createdByName ?? "",
    row.assignedEvaluatorName ?? "",
  ];
}

export const OCCURRENCE_REPORT_XLSX_COLUMNS: Column<OccurrenceReportRow>[] = [
  { header: "Código", cell: (row) => ({ value: row.publicCode }) },
  {
    header: "Data da PP",
    cell: (row) => ({ value: toXlsxDate(row.occurredAt), type: Date, format: XLSX_DATE_FORMAT }),
  },
  { header: "Área", cell: (row) => ({ value: row.areaName ?? "" }) },
  { header: "Contrato", cell: (row) => ({ value: formatContractLabel(row) }) },
  {
    header: "Contratada executante",
    cell: (row) => ({ value: row.contractorOrganizationName ?? "" }),
  },
  { header: "Status", cell: (row) => ({ value: row.status }) },
  {
    header: "Família",
    cell: (row) => ({ value: DASHBOARD_OCCURRENCE_STATUS_FAMILY_LABELS[row.statusFamily] }),
  },
  { header: "Severidade", cell: (row) => ({ value: row.severity }) },
  {
    header: "Situação da Interdição Oficial",
    cell: (row) => ({ value: row.decisionType ?? "" }),
  },
  { header: "Referência IMS", cell: (row) => ({ value: row.imsReferenceCode ?? "" }) },
  { header: "Unidade", cell: (row) => ({ value: row.unitName ?? "" }) },
  { header: "Gerência", cell: (row) => ({ value: row.managementDepartmentName ?? "" }) },
  {
    header: "Parado em",
    cell: (row) => ({ value: toXlsxDate(row.stoppedAt), type: Date, format: XLSX_DATE_FORMAT }),
  },
  {
    header: "Avaliado em",
    cell: (row) => ({ value: toXlsxDate(row.evaluatedAt), type: Date, format: XLSX_DATE_FORMAT }),
  },
  {
    header: "Liberado em",
    cell: (row) => ({ value: toXlsxDate(row.releasedAt), type: Date, format: XLSX_DATE_FORMAT }),
  },
  {
    header: "Encerrado em",
    cell: (row) => ({ value: toXlsxDate(row.closedAt), type: Date, format: XLSX_DATE_FORMAT }),
  },
  {
    header: "Cancelado em",
    cell: (row) => ({ value: toXlsxDate(row.cancelledAt), type: Date, format: XLSX_DATE_FORMAT }),
  },
  {
    header: "Motivo do cancelamento",
    cell: (row) => ({ value: row.cancellationReason ?? "" }),
  },
  { header: "Registrado por", cell: (row) => ({ value: row.createdByName ?? "" }) },
  {
    header: "Avaliador responsável",
    cell: (row) => ({ value: row.assignedEvaluatorName ?? "" }),
  },
];

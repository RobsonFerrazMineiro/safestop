/**
 * Validação de filtros/paginação/ordenação dos Relatórios (Sprint 3.3).
 * Referência: docs/decisions/REPORTS-DECISIONS.md
 *
 * Regra inviolável: ordenação NUNCA aceita campo arbitrário — cada schema de
 * sort usa `z.enum` contra o allowlist fixo importado de `@safestop/types`
 * (o mesmo allowlist replicado no allowlist interno de cada RPC). Um valor
 * fora da lista falha na validação do client antes mesmo de chegar à RPC.
 */

import {
  ACTION_ITEM_REPORT_SORT_FIELDS,
  ACTION_ITEM_STATUSES,
  AWARENESS_REPORT_SORT_FIELDS,
  OCCURRENCE_REPORT_SORT_FIELDS,
  OCCURRENCE_SEVERITIES,
  OCCURRENCE_STATUSES,
  REPORT_PAGINATION_MAX_LIMIT,
  REPORT_SORT_DIRECTIONS,
} from "@safestop/types";
import { z } from "zod";

const uuidSchema = z.string().uuid("Identificador inválido.");

const optionalUuidSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value === "" || value === null ? undefined : value))
  .refine((value) => value === undefined || z.string().uuid().safeParse(value).success, {
    message: "Identificador inválido.",
  });

/**
 * Período opcional — mesmo contrato de `DashboardPeriodFilter`
 * (@safestop/types), reaproveitado (não redefinido) nas RPCs de relatório.
 */
export const reportPeriodFilterSchema = z.object({
  startAt: z.string().datetime({ message: "Data inicial inválida." }),
  endAt: z.string().datetime({ message: "Data final inválida." }),
});

const optionalPeriodSchema = reportPeriodFilterSchema.optional().nullable();

export const reportCursorSchema = z.object({
  sortValue: z.string(),
  id: uuidSchema,
});

/** Paginação — limite máximo 100 (docs/api.md), nunca aceitar valor maior. */
export const reportPaginationSchema = z.object({
  cursor: reportCursorSchema.optional().nullable(),
  limit: z.number().int().min(1).max(REPORT_PAGINATION_MAX_LIMIT).optional(),
});

export const reportSortDirectionSchema = z.enum(REPORT_SORT_DIRECTIONS, {
  errorMap: () => ({ message: "Direção de ordenação inválida." }),
});

// ============================================================================
// Relatório de Ocorrências
// ============================================================================

export const occurrenceReportFiltersSchema = z.object({
  period: optionalPeriodSchema,
  areaId: optionalUuidSchema,
  contractId: optionalUuidSchema,
  contractorOrganizationId: optionalUuidSchema,
  status: z.array(z.enum(OCCURRENCE_STATUSES)).optional(),
  severity: z.array(z.enum(OCCURRENCE_SEVERITIES)).optional(),
  hasIms: z.boolean().optional().nullable(),
  search: z
    .string()
    .trim()
    .max(50, "Busca deve ter no máximo 50 caracteres.")
    .optional()
    .nullable(),
});

export const occurrenceReportSortSchema = z.object({
  field: z.enum(OCCURRENCE_REPORT_SORT_FIELDS, {
    errorMap: () => ({ message: "Campo de ordenação inválido." }),
  }),
  direction: reportSortDirectionSchema,
});

// ============================================================================
// Relatório de Plano de Ação
// ============================================================================

export const actionItemReportFiltersSchema = z.object({
  period: optionalPeriodSchema,
  responsibleMemberId: optionalUuidSchema,
  status: z.array(z.enum(ACTION_ITEM_STATUSES)).optional(),
  overdueOnly: z.boolean().optional().nullable(),
  dueSoonOnly: z.boolean().optional().nullable(),
  dueSoonDays: z.number().int().min(1).max(30).optional(),
});

export const actionItemReportSortSchema = z.object({
  field: z.enum(ACTION_ITEM_REPORT_SORT_FIELDS, {
    errorMap: () => ({ message: "Campo de ordenação inválido." }),
  }),
  direction: reportSortDirectionSchema,
});

// ============================================================================
// Relatório de Ciência
// ============================================================================

export const awarenessReportFiltersSchema = z.object({
  period: optionalPeriodSchema,
  occurrenceId: optionalUuidSchema,
  recipientMemberId: optionalUuidSchema,
  pendingOnly: z.boolean().optional().nullable(),
});

export const awarenessReportSortSchema = z.object({
  field: z.enum(AWARENESS_REPORT_SORT_FIELDS, {
    errorMap: () => ({ message: "Campo de ordenação inválido." }),
  }),
  direction: reportSortDirectionSchema,
});

export type ReportPeriodFilterInput = z.infer<typeof reportPeriodFilterSchema>;
export type ReportCursorInput = z.infer<typeof reportCursorSchema>;
export type ReportPaginationInput = z.infer<typeof reportPaginationSchema>;
export type OccurrenceReportFiltersInput = z.infer<typeof occurrenceReportFiltersSchema>;
export type OccurrenceReportSortInput = z.infer<typeof occurrenceReportSortSchema>;
export type ActionItemReportFiltersInput = z.infer<typeof actionItemReportFiltersSchema>;
export type ActionItemReportSortInput = z.infer<typeof actionItemReportSortSchema>;
export type AwarenessReportFiltersInput = z.infer<typeof awarenessReportFiltersSchema>;
export type AwarenessReportSortInput = z.infer<typeof awarenessReportSortSchema>;

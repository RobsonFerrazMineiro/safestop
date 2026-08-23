/**
 * Contratos dos Relatórios (Sprint 3.3 — Ocorrências, Plano de Ação, Ciência).
 * Referência: docs/decisions/REPORTS-DECISIONS.md (PO-REP-1 a PO-REP-6)
 *
 * Convenção de nomenclatura confirmada contra o projeto real antes de fixar:
 * - Filtros de listagem existentes usam sufixo `ListFilters` (OccurrenceListFilters,
 *   PreventiveStopListFilters, OrganizationContactListFilters). Aqui usamos
 *   `ReportFilters` propositalmente — não é a mesma listagem operacional, é o
 *   contrato de um domínio novo (Relatórios) cujas RPCs já se chamam
 *   `list_*_report`; distinguir o nome evita confundir com os filtros de tela
 *   operacional existentes.
 * - Itens de listagem paginada existentes usam `ListItem` (NotificationListItem)
 *   ou o nome do domínio direto (MdhoPendingApprovalItem). Aqui usamos `ReportRow`
 *   por ser exatamente a nomenclatura da matriz de colunas aprovada em
 *   REPORTS-DECISIONS.md ("matriz de colunas" = linhas/colunas de relatório).
 * - Cursor não é string simples (diferente de list_my_notifications) — as RPCs
 *   list_*_report usam cursor keyset jsonb `{ sortValue, id }` (ver migrations
 *   20260822191000/192000/193000). O tipo `ReportCursor` reflete o contrato real.
 *
 * Fórmulas de negócio (isOverdueActionItem, isDueSoonActionItem,
 * isActiveInterdictionOccurrence, famílias de status) são IMPORTADAS de
 * dashboard-formulas.ts — nunca redefinidas aqui (paridade obrigatória com o
 * Dashboard 3.2, critério de aceite desta sprint).
 */

import type { ActionItemStatus } from "./action-plan";
import { isActionItemStatus } from "./action-plan";
import type { DashboardPeriodFilter } from "./dashboard-metrics";
import {
  isActiveInterdictionOccurrence,
  isDueSoonActionItem,
  isOverdueActionItem,
} from "./dashboard-formulas";
import type { DashboardOccurrenceStatusFamily } from "./dashboard-formulas";
import type { NotificationEventType } from "./notification";
import { isNotificationEventType, requiresNotificationAwareness } from "./notification";
import type {
  OccurrenceDecisionType,
  OccurrenceSeverity,
  OccurrenceStatus,
} from "./occurrence-status";
import {
  isOccurrenceDecisionType,
  isOccurrenceSeverity,
  isOccurrenceStatus,
} from "./occurrence-status";

// ============================================================================
// Enumerações do domínio de relatórios
// ============================================================================

/** Mesmo domínio do CHECK de `report_export_audit.report_type`. */
export const REPORT_TYPES = ["OCCURRENCES", "ACTION_ITEMS", "AWARENESS"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];

export function isReportType(value: string): value is ReportType {
  return (REPORT_TYPES as readonly string[]).includes(value);
}

/** Mesmo domínio do CHECK de `report_export_audit.export_format`. */
export const REPORT_EXPORT_FORMATS = ["CSV", "XLSX"] as const;
export type ReportExportFormat = (typeof REPORT_EXPORT_FORMATS)[number];

export function isReportExportFormat(value: string): value is ReportExportFormat {
  return (REPORT_EXPORT_FORMATS as readonly string[]).includes(value);
}

export const REPORT_SORT_DIRECTIONS = ["asc", "desc"] as const;
export type ReportSortDirection = (typeof REPORT_SORT_DIRECTIONS)[number];

export function isReportSortDirection(value: string): value is ReportSortDirection {
  return (REPORT_SORT_DIRECTIONS as readonly string[]).includes(value);
}

/** Paginação: espelha docs/api.md (cursor, limite padrão 20, máximo 100). */
export const REPORT_PAGINATION_DEFAULT_LIMIT = 20;
export const REPORT_PAGINATION_MAX_LIMIT = 100;

/** PO-REP: exportação completa é limitada a 10.000 linhas — acima disso, erro tratado. */
export const REPORT_EXPORT_MAX_ROWS = 10_000;

// ----------------------------------------------------------------------------
// Allowlists de ordenação — espelham EXATAMENTE o allowlist interno de cada
// RPC (list_occurrences_report/list_action_items_report/list_awareness_report).
// Nunca aceitar campo fora desta lista — nunca inventar coluna de ordenação.
// ----------------------------------------------------------------------------

export const OCCURRENCE_REPORT_SORT_FIELDS = [
  "public_code",
  "occurred_at",
  "status",
  "severity",
  "area",
] as const;
export type OccurrenceReportSortField = (typeof OCCURRENCE_REPORT_SORT_FIELDS)[number];

export function isOccurrenceReportSortField(value: string): value is OccurrenceReportSortField {
  return (OCCURRENCE_REPORT_SORT_FIELDS as readonly string[]).includes(value);
}

export const ACTION_ITEM_REPORT_SORT_FIELDS = ["due_at", "status", "title"] as const;
export type ActionItemReportSortField = (typeof ACTION_ITEM_REPORT_SORT_FIELDS)[number];

export function isActionItemReportSortField(value: string): value is ActionItemReportSortField {
  return (ACTION_ITEM_REPORT_SORT_FIELDS as readonly string[]).includes(value);
}

export const AWARENESS_REPORT_SORT_FIELDS = ["created_at", "event_type"] as const;
export type AwarenessReportSortField = (typeof AWARENESS_REPORT_SORT_FIELDS)[number];

export function isAwarenessReportSortField(value: string): value is AwarenessReportSortField {
  return (AWARENESS_REPORT_SORT_FIELDS as readonly string[]).includes(value);
}

export type ReportSort<TField extends string> = {
  field: TField;
  direction: ReportSortDirection;
};

export type OccurrenceReportSort = ReportSort<OccurrenceReportSortField>;
export type ActionItemReportSort = ReportSort<ActionItemReportSortField>;
export type AwarenessReportSort = ReportSort<AwarenessReportSortField>;

// ============================================================================
// Cursor e paginação
// ============================================================================

/** Cursor keyset retornado por `nextCursor` — não é string simples (ver nota topo). */
export type ReportCursor = {
  sortValue: string;
  id: string;
};

export type ReportPagination = {
  cursor?: ReportCursor | null;
  limit?: number;
};

// ============================================================================
// Filtros por relatório (contrato de UI → parâmetros de RPC)
// ============================================================================

export type OccurrenceReportFilters = {
  period?: DashboardPeriodFilter | null;
  areaId?: string | null;
  contractId?: string | null;
  contractorOrganizationId?: string | null;
  status?: OccurrenceStatus[];
  severity?: OccurrenceSeverity[];
  /** true = só com IMS, false = só sem IMS, ausente = sem filtro. */
  hasIms?: boolean | null;
  /** Busca por `public_code` (contains, case-insensitive). */
  search?: string | null;
};

export type ActionItemReportFilters = {
  period?: DashboardPeriodFilter | null;
  responsibleMemberId?: string | null;
  status?: ActionItemStatus[];
  overdueOnly?: boolean | null;
  dueSoonOnly?: boolean | null;
  /** Mesmo clamp da RPC (1–30); default 3 = DASHBOARD_DUE_SOON_DAYS_DEFAULT. */
  dueSoonDays?: number;
};

export type AwarenessReportFilters = {
  period?: DashboardPeriodFilter | null;
  occurrenceId?: string | null;
  recipientMemberId?: string | null;
  pendingOnly?: boolean | null;
};

// ============================================================================
// Linhas de relatório (contrato final PO-REP-3 para Ocorrências; espelha
// exatamente os campos retornados pelas RPCs para Plano de Ação/Ciência)
// ============================================================================

/** 19 campos da matriz de colunas consolidada (REPORTS-DECISIONS.md). */
export type OccurrenceReportRow = {
  id: string;
  publicCode: string;
  occurredAt: string;
  areaId: string | null;
  areaName: string | null;
  contractId: string | null;
  contractNumber: string | null;
  contractName: string | null;
  contractorOrganizationId: string | null;
  contractorOrganizationName: string | null;
  status: OccurrenceStatus;
  statusFamily: DashboardOccurrenceStatusFamily;
  severity: OccurrenceSeverity;
  decisionType: OccurrenceDecisionType | null;
  imsReferenceCode: string | null;
  unitId: string | null;
  unitName: string | null;
  managementDepartmentId: string | null;
  managementDepartmentName: string | null;
  stoppedAt: string | null;
  evaluatedAt: string | null;
  releasedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  /** Sensível — nome de pessoa (created_by). */
  createdByName: string | null;
  /** Sensível — nome de pessoa (assigned_evaluator_id). */
  assignedEvaluatorName: string | null;
};

export type ActionItemReportRow = {
  id: string;
  occurrenceId: string;
  actionPlanId: string;
  title: string;
  responsibleMemberId: string;
  /** Sensível — nome de pessoa (responsible_member_id). */
  responsibleMemberName: string | null;
  dueAt: string;
  status: ActionItemStatus;
  completedAt: string | null;
  validatedAt: string | null;
  /** Calculado pela RPC com a MESMA fórmula de isOverdueActionItem. */
  isOverdue: boolean;
  /** Calculado pela RPC com a MESMA fórmula de isDueSoonActionItem. */
  isDueSoon: boolean;
};

export type AwarenessReportRow = {
  id: string;
  occurrenceId: string | null;
  notificationEventId: string;
  eventType: NotificationEventType;
  recipientMemberId: string;
  /** Sensível — nome de pessoa (recipient_member_id). */
  recipientMemberName: string | null;
  requiresAwareness: boolean;
  /** Leitura ≠ ciência — nunca tratar como confirmação (docs/notifications.md). */
  readAt: string | null;
  awarenessConfirmedAt: string | null;
  createdAt: string;
};

// ============================================================================
// Resultados paginados
// ============================================================================

export type ListOccurrencesReportResult = {
  items: OccurrenceReportRow[];
  nextCursor: ReportCursor | null;
  hasNext: boolean;
};

export type ListActionItemsReportResult = {
  items: ActionItemReportRow[];
  nextCursor: ReportCursor | null;
  hasNext: boolean;
};

export type ListAwarenessReportResult = {
  items: AwarenessReportRow[];
  nextCursor: ReportCursor | null;
  hasNext: boolean;
};

// ============================================================================
// Construção dos argumentos de RPC (nomes exatos das migrations Sprint 3.3)
// ============================================================================

export type ListOccurrencesReportRpcArgs = {
  p_organization_id: string;
  p_period_start: string | null;
  p_period_end: string | null;
  p_area_id: string | null;
  p_contract_id: string | null;
  p_contractor_organization_id: string | null;
  p_status: string[] | null;
  p_severity: string[] | null;
  p_has_ims: boolean | null;
  p_search: string | null;
  p_sort_field: string;
  p_sort_direction: string;
  p_cursor: ReportCursor | null;
  p_limit: number;
};

function clampReportLimit(limit: number | undefined): number {
  return Math.min(
    Math.max(limit ?? REPORT_PAGINATION_DEFAULT_LIMIT, 1),
    REPORT_PAGINATION_MAX_LIMIT,
  );
}

export function buildListOccurrencesReportRpcArgs(
  organizationId: string,
  filters: OccurrenceReportFilters = {},
  sort: OccurrenceReportSort = { field: "occurred_at", direction: "desc" },
  pagination: ReportPagination = {},
): ListOccurrencesReportRpcArgs {
  return {
    p_organization_id: organizationId,
    p_period_start: filters.period?.startAt ?? null,
    p_period_end: filters.period?.endAt ?? null,
    p_area_id: filters.areaId ?? null,
    p_contract_id: filters.contractId ?? null,
    p_contractor_organization_id: filters.contractorOrganizationId ?? null,
    p_status: filters.status && filters.status.length > 0 ? filters.status : null,
    p_severity: filters.severity && filters.severity.length > 0 ? filters.severity : null,
    p_has_ims: filters.hasIms ?? null,
    p_search: filters.search?.trim() ? filters.search.trim() : null,
    p_sort_field: sort.field,
    p_sort_direction: sort.direction,
    p_cursor: pagination.cursor ?? null,
    p_limit: clampReportLimit(pagination.limit),
  };
}

export type ListActionItemsReportRpcArgs = {
  p_organization_id: string;
  p_period_start: string | null;
  p_period_end: string | null;
  p_responsible_member_id: string | null;
  p_status: string[] | null;
  p_overdue_only: boolean | null;
  p_due_soon_only: boolean | null;
  p_due_soon_days: number;
  p_sort_field: string;
  p_sort_direction: string;
  p_cursor: ReportCursor | null;
  p_limit: number;
};

export function buildListActionItemsReportRpcArgs(
  organizationId: string,
  filters: ActionItemReportFilters = {},
  sort: ActionItemReportSort = { field: "due_at", direction: "asc" },
  pagination: ReportPagination = {},
): ListActionItemsReportRpcArgs {
  return {
    p_organization_id: organizationId,
    p_period_start: filters.period?.startAt ?? null,
    p_period_end: filters.period?.endAt ?? null,
    p_responsible_member_id: filters.responsibleMemberId ?? null,
    p_status: filters.status && filters.status.length > 0 ? filters.status : null,
    p_overdue_only: filters.overdueOnly ?? null,
    p_due_soon_only: filters.dueSoonOnly ?? null,
    p_due_soon_days: Math.min(Math.max(filters.dueSoonDays ?? 3, 1), 30),
    p_sort_field: sort.field,
    p_sort_direction: sort.direction,
    p_cursor: pagination.cursor ?? null,
    p_limit: clampReportLimit(pagination.limit),
  };
}

export type ListAwarenessReportRpcArgs = {
  p_organization_id: string;
  p_period_start: string | null;
  p_period_end: string | null;
  p_occurrence_id: string | null;
  p_recipient_member_id: string | null;
  p_pending_only: boolean | null;
  p_sort_field: string;
  p_sort_direction: string;
  p_cursor: ReportCursor | null;
  p_limit: number;
};

export function buildListAwarenessReportRpcArgs(
  organizationId: string,
  filters: AwarenessReportFilters = {},
  sort: AwarenessReportSort = { field: "created_at", direction: "desc" },
  pagination: ReportPagination = {},
): ListAwarenessReportRpcArgs {
  return {
    p_organization_id: organizationId,
    p_period_start: filters.period?.startAt ?? null,
    p_period_end: filters.period?.endAt ?? null,
    p_occurrence_id: filters.occurrenceId ?? null,
    p_recipient_member_id: filters.recipientMemberId ?? null,
    p_pending_only: filters.pendingOnly ?? null,
    p_sort_field: sort.field,
    p_sort_direction: sort.direction,
    p_cursor: pagination.cursor ?? null,
    p_limit: clampReportLimit(pagination.limit),
  };
}

// ============================================================================
// Parsing defensivo do payload jsonb (mesmo padrão de dashboard-rpc.ts)
// ============================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readCursor(value: unknown): ReportCursor | null {
  if (!isRecord(value)) {
    return null;
  }

  const sortValue = readString(value.sortValue);
  const id = readString(value.id);

  if (sortValue === null || id === null) {
    return null;
  }

  return { sortValue, id };
}

export function mapOccurrenceReportRow(raw: unknown): OccurrenceReportRow | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = readString(raw.id);
  const publicCode = readString(raw.publicCode);
  const occurredAt = readString(raw.occurredAt);
  const status = readString(raw.status);
  const statusFamily = readString(raw.statusFamily);
  const severity = readString(raw.severity);

  if (
    !id ||
    !publicCode ||
    !occurredAt ||
    !status ||
    !isOccurrenceStatus(status) ||
    !statusFamily ||
    !severity ||
    !isOccurrenceSeverity(severity)
  ) {
    return null;
  }

  const decisionType = readNullableString(raw.decisionType);

  return {
    id,
    publicCode,
    occurredAt,
    areaId: readNullableString(raw.areaId),
    areaName: readNullableString(raw.areaName),
    contractId: readNullableString(raw.contractId),
    contractNumber: readNullableString(raw.contractNumber),
    contractName: readNullableString(raw.contractName),
    contractorOrganizationId: readNullableString(raw.contractorOrganizationId),
    contractorOrganizationName: readNullableString(raw.contractorOrganizationName),
    status,
    statusFamily: statusFamily as DashboardOccurrenceStatusFamily,
    severity,
    decisionType: decisionType && isOccurrenceDecisionType(decisionType) ? decisionType : null,
    imsReferenceCode: readNullableString(raw.imsReferenceCode),
    unitId: readNullableString(raw.unitId),
    unitName: readNullableString(raw.unitName),
    managementDepartmentId: readNullableString(raw.managementDepartmentId),
    managementDepartmentName: readNullableString(raw.managementDepartmentName),
    stoppedAt: readNullableString(raw.stoppedAt),
    evaluatedAt: readNullableString(raw.evaluatedAt),
    releasedAt: readNullableString(raw.releasedAt),
    closedAt: readNullableString(raw.closedAt),
    cancelledAt: readNullableString(raw.cancelledAt),
    cancellationReason: readNullableString(raw.cancellationReason),
    createdByName: readNullableString(raw.createdByName),
    assignedEvaluatorName: readNullableString(raw.assignedEvaluatorName),
  };
}

export function mapActionItemReportRow(raw: unknown): ActionItemReportRow | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = readString(raw.id);
  const occurrenceId = readString(raw.occurrenceId);
  const actionPlanId = readString(raw.actionPlanId);
  const title = readString(raw.title);
  const responsibleMemberId = readString(raw.responsibleMemberId);
  const dueAt = readString(raw.dueAt);
  const status = readString(raw.status);

  if (
    !id ||
    !occurrenceId ||
    !actionPlanId ||
    !title ||
    !responsibleMemberId ||
    !dueAt ||
    !status ||
    !isActionItemStatus(status)
  ) {
    return null;
  }

  return {
    id,
    occurrenceId,
    actionPlanId,
    title,
    responsibleMemberId,
    responsibleMemberName: readNullableString(raw.responsibleMemberName),
    dueAt,
    status,
    completedAt: readNullableString(raw.completedAt),
    validatedAt: readNullableString(raw.validatedAt),
    isOverdue: readBoolean(raw.isOverdue, false),
    isDueSoon: readBoolean(raw.isDueSoon, false),
  };
}

export function mapAwarenessReportRow(raw: unknown): AwarenessReportRow | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = readString(raw.id);
  const notificationEventId = readString(raw.notificationEventId);
  const eventType = readString(raw.eventType);
  const recipientMemberId = readString(raw.recipientMemberId);
  const createdAt = readString(raw.createdAt);

  if (
    !id ||
    !notificationEventId ||
    !eventType ||
    !isNotificationEventType(eventType) ||
    !recipientMemberId ||
    !createdAt
  ) {
    return null;
  }

  return {
    id,
    occurrenceId: readNullableString(raw.occurrenceId),
    notificationEventId,
    eventType,
    recipientMemberId,
    recipientMemberName: readNullableString(raw.recipientMemberName),
    requiresAwareness: readBoolean(raw.requiresAwareness, false),
    readAt: readNullableString(raw.readAt),
    awarenessConfirmedAt: readNullableString(raw.awarenessConfirmedAt),
    createdAt,
  };
}

function readItemsArray<TRow>(value: unknown, mapRow: (raw: unknown) => TRow | null): TRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: TRow[] = [];
  for (const entry of value) {
    const mapped = mapRow(entry);
    if (mapped !== null) {
      items.push(mapped);
    }
  }

  return items;
}

export function mapListOccurrencesReportResult(raw: unknown): ListOccurrencesReportResult {
  if (!isRecord(raw)) {
    return { items: [], nextCursor: null, hasNext: false };
  }

  return {
    items: readItemsArray(raw.items, mapOccurrenceReportRow),
    nextCursor: readCursor(raw.nextCursor),
    hasNext: readBoolean(raw.hasNext, false),
  };
}

export function mapListActionItemsReportResult(raw: unknown): ListActionItemsReportResult {
  if (!isRecord(raw)) {
    return { items: [], nextCursor: null, hasNext: false };
  }

  return {
    items: readItemsArray(raw.items, mapActionItemReportRow),
    nextCursor: readCursor(raw.nextCursor),
    hasNext: readBoolean(raw.hasNext, false),
  };
}

export function mapListAwarenessReportResult(raw: unknown): ListAwarenessReportResult {
  if (!isRecord(raw)) {
    return { items: [], nextCursor: null, hasNext: false };
  }

  return {
    items: readItemsArray(raw.items, mapAwarenessReportRow),
    nextCursor: readCursor(raw.nextCursor),
    hasNext: readBoolean(raw.hasNext, false),
  };
}

// ============================================================================
// Erros de RPC — list_*_report levantam exceções Postgres reais (RAISE
// EXCEPTION), não o envelope `{ success: false, error }` usado em outras RPCs
// (ex.: get_dashboard_kpis). O código SQLSTATE (`error.code`) sozinho NÃO
// distingue ORGANIZATION_NOT_ALLOWED de PERMISSION_DENIED (ambos 42501) —
// a distinção exige inspecionar o texto de `error.message`, que é exatamente
// a string passada em `RAISE EXCEPTION '<mensagem>'` nas migrations.
// ============================================================================

export const REPORT_RPC_ERROR_CODES = [
  "UNAUTHORIZED",
  "ORGANIZATION_NOT_ALLOWED",
  "PERMISSION_DENIED",
  "VALIDATION_ERROR",
  "INVALID_SORT_FIELD",
  "INVALID_SORT_DIRECTION",
  "UNKNOWN",
] as const;

export type ReportRpcErrorCode = (typeof REPORT_RPC_ERROR_CODES)[number];

type ReportRpcErrorLike = {
  message?: string | null;
  code?: string | null;
};

export function parseReportRpcErrorCode(
  error: ReportRpcErrorLike | null | undefined,
): ReportRpcErrorCode {
  const message = error?.message ?? "";

  if (message.startsWith("ORGANIZATION_NOT_ALLOWED")) {
    return "ORGANIZATION_NOT_ALLOWED";
  }

  if (message.startsWith("PERMISSION_DENIED")) {
    return "PERMISSION_DENIED";
  }

  if (message.startsWith("UNAUTHORIZED")) {
    return "UNAUTHORIZED";
  }

  if (message.startsWith("VALIDATION_ERROR")) {
    return "VALIDATION_ERROR";
  }

  if (message.startsWith("INVALID_SORT_FIELD")) {
    return "INVALID_SORT_FIELD";
  }

  if (message.startsWith("INVALID_SORT_DIRECTION")) {
    return "INVALID_SORT_DIRECTION";
  }

  return "UNKNOWN";
}

const REPORT_RPC_SAFE_MESSAGES: Record<ReportRpcErrorCode, string> = {
  UNAUTHORIZED: "Sessão expirada. Faça login novamente.",
  ORGANIZATION_NOT_ALLOWED: "Você não tem acesso a esta organização.",
  PERMISSION_DENIED: "Você não possui permissão para acessar este relatório.",
  VALIDATION_ERROR: "Verifique os filtros informados e tente novamente.",
  INVALID_SORT_FIELD: "Ordenação inválida. Verifique os filtros e tente novamente.",
  INVALID_SORT_DIRECTION: "Ordenação inválida. Verifique os filtros e tente novamente.",
  UNKNOWN: "Não foi possível carregar o relatório. Tente novamente mais tarde.",
};

export function getReportRpcSafeMessage(code: ReportRpcErrorCode): string {
  return REPORT_RPC_SAFE_MESSAGES[code];
}

export class ReportRpcError extends Error {
  readonly code: ReportRpcErrorCode;

  constructor(code: ReportRpcErrorCode) {
    super(getReportRpcSafeMessage(code));
    this.name = "ReportRpcError";
    this.code = code;
  }
}

/** Defesa em profundidade — RPC ainda não migrada no ambiente (ex.: staging atrasado). */
export function isReportRpcUnavailableError(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }

  const code = typeof error.code === "string" ? error.code : "";
  return code === "PGRST202" || code === "42883";
}

// ============================================================================
// Resumo do conjunto filtrado (contagem total + subcontagens)
// Reaproveita fórmulas de dashboard-formulas.ts/notification.ts — nunca
// redefinidas aqui — garante paridade numérica com o Dashboard 3.2.
// ============================================================================

export type OccurrenceReportSummary = {
  totalRows: number;
  /**
   * Interdições ativas dentro do resultado — mesma fórmula do Dashboard
   * (`isActiveInterdictionOccurrence`). Paridade numérica com o KPI
   * `activeInterdictions` do Dashboard 3.2 só é garantida quando: (1) mesmo
   * filtro de escopo (área/contrato/contratada) em ambos; (2) SEM filtro de
   * período no Reports (o Dashboard nunca filtra estoque por período); e
   * (3) `rows` representa o conjunto completo filtrado, não apenas a página
   * atual — ver docs/decisions/REPORTS-DECISIONS.md, adendo "Correção Gate G".
   */
  activeInterdictionsCount: number;
};

export type ActionItemReportSummary = {
  totalRows: number;
  overdueCount: number;
  dueSoonCount: number;
};

export type AwarenessReportSummary = {
  totalRows: number;
  pendingCount: number;
};

export function computeOccurrenceReportSummary(
  rows: readonly OccurrenceReportRow[],
): OccurrenceReportSummary {
  let activeInterdictionsCount = 0;

  for (const row of rows) {
    if (isActiveInterdictionOccurrence(row.status)) {
      activeInterdictionsCount += 1;
    }
  }

  return { totalRows: rows.length, activeInterdictionsCount };
}

export function computeActionItemReportSummary(
  rows: readonly ActionItemReportRow[],
  now = new Date(),
  dueSoonDays?: number,
): ActionItemReportSummary {
  let overdueCount = 0;
  let dueSoonCount = 0;

  for (const row of rows) {
    if (isOverdueActionItem({ status: row.status, dueAt: row.dueAt, now })) {
      overdueCount += 1;
    }

    if (isDueSoonActionItem({ status: row.status, dueAt: row.dueAt, now }, dueSoonDays)) {
      dueSoonCount += 1;
    }
  }

  return { totalRows: rows.length, overdueCount, dueSoonCount };
}

export function computeAwarenessReportSummary(
  rows: readonly AwarenessReportRow[],
): AwarenessReportSummary {
  let pendingCount = 0;

  for (const row of rows) {
    if (requiresNotificationAwareness(row)) {
      pendingCount += 1;
    }
  }

  return { totalRows: rows.length, pendingCount };
}

// ============================================================================
// Auditoria de exportação — log_report_export (PO-REP-6)
// ============================================================================

export type LogReportExportInput = {
  organizationId: string;
  reportType: ReportType;
  exportFormat: ReportExportFormat;
  filters: Record<string, unknown>;
  rowCount: number;
};

export type LogReportExportRpcArgs = {
  p_organization_id: string;
  p_report_type: string;
  p_export_format: string;
  p_filters: Record<string, unknown>;
  p_row_count: number;
};

export function buildLogReportExportRpcArgs(input: LogReportExportInput): LogReportExportRpcArgs {
  return {
    p_organization_id: input.organizationId,
    p_report_type: input.reportType,
    p_export_format: input.exportFormat,
    p_filters: input.filters,
    p_row_count: input.rowCount,
  };
}

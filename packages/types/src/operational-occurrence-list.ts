/**
 * Contratos da lista operacional de Paralisações Preventivas (PR-D1 / PO-UX-10).
 * Fonte da verdade:
 *   supabase/migrations/20260825220000_list_operational_occurrences.sql
 *   supabase/migrations/20260913190000_gate13c1_list_operational_occurrences_workspace.sql
 *
 * Não reutilizar OccurrenceReportFilters / REPORT_* / report.read.
 * Helpers de nome (resolve_profile_display_name, resolve_organization_display_name)
 * são resolvidos no SQL — o client só mapeia o jsonb camelCase.
 *
 * Gate 13C.1: `p_workspace_id` opcional (DEFAULT NULL). Omitido ≡ NULL (legado).
 * Consumo Web do parâmetro = Gate 13C.2.
 */

import type { OccurrenceListFilters, OccurrenceSummary } from "./occurrence";
import { isOccurrenceSeverity, isOccurrenceStatus } from "./occurrence-status";

/** Espelha o clamp SQL (`least(greatest(coalesce(p_limit, 20), 1), 100)`). */
export const OPERATIONAL_OCCURRENCE_LIST_DEFAULT_LIMIT = 20;
export const OPERATIONAL_OCCURRENCE_LIST_MAX_LIMIT = 100;

/** Cursor keyset real: `{ sortValue, id }` (created_at UTC + id). Sem OFFSET. */
export type OperationalOccurrenceListCursor = {
  sortValue: string;
  id: string;
};

export type OperationalOccurrenceListPagination = {
  cursor?: OperationalOccurrenceListCursor | null;
  limit?: number;
};

export type ListOperationalOccurrencesResult = {
  items: OccurrenceSummary[];
  nextCursor: OperationalOccurrenceListCursor | null;
  hasNext: boolean;
};

/** Args alinhados à assinatura REAL da RPC (nomes `p_*`). */
export type ListOperationalOccurrencesRpcArgs = {
  p_organization_id: string;
  p_search: string | null;
  p_area_id: string | null;
  p_contractor_organization_id: string | null;
  p_status: string[] | null;
  p_severity: string[] | null;
  p_ims_reference_code: string | null;
  p_cursor: OperationalOccurrenceListCursor | null;
  p_limit: number;
  /** Gate 13C.1 — NULL/omitido = legado Organization-scoped. */
  p_workspace_id: string | null;
};

function clampOperationalOccurrenceListLimit(limit: number | undefined): number {
  return Math.min(
    Math.max(limit ?? OPERATIONAL_OCCURRENCE_LIST_DEFAULT_LIMIT, 1),
    OPERATIONAL_OCCURRENCE_LIST_MAX_LIMIT,
  );
}

function trimToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toOptionalUuid(value: string | null | undefined): string | null {
  return trimToNull(value);
}

function toCursor(
  cursor: OperationalOccurrenceListCursor | { sortValue: string; id: string } | null | undefined,
): OperationalOccurrenceListCursor | null {
  if (!cursor) {
    return null;
  }

  const sortValue = cursor.sortValue.trim();
  const id = cursor.id.trim();

  if (!sortValue || !id) {
    return null;
  }

  return { sortValue, id };
}

export function buildListOperationalOccurrencesRpcArgs(
  organizationId: string,
  filters: OccurrenceListFilters = {},
): ListOperationalOccurrencesRpcArgs {
  const severity = filters.severity;

  return {
    p_organization_id: organizationId,
    p_search: trimToNull(filters.search),
    p_area_id: toOptionalUuid(filters.areaId),
    p_contractor_organization_id: toOptionalUuid(filters.contractorOrganizationId),
    p_status: filters.status && filters.status.length > 0 ? filters.status : null,
    p_severity: severity ? [severity] : null,
    p_ims_reference_code: trimToNull(filters.imsReferenceCode),
    p_cursor: toCursor(filters.pagination?.cursor),
    p_limit: clampOperationalOccurrenceListLimit(filters.pagination?.limit),
    p_workspace_id: toOptionalUuid(filters.workspaceId),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readCursor(value: unknown): OperationalOccurrenceListCursor | null {
  if (!isRecord(value)) {
    return null;
  }

  const sortValue = readString(value.sortValue);
  const id = readString(value.id);

  if (sortValue === null || id === null || sortValue.length === 0 || id.length === 0) {
    return null;
  }

  return { sortValue, id };
}

export function mapOccurrenceSummary(raw: unknown): OccurrenceSummary | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = readString(raw.id);
  const publicCode = readString(raw.publicCode);
  const title = readString(raw.title);
  const status = readString(raw.status);
  const severity = readString(raw.severity);
  const createdAt = readString(raw.createdAt);

  if (
    !id ||
    !publicCode ||
    !title ||
    !status ||
    !isOccurrenceStatus(status) ||
    !severity ||
    !isOccurrenceSeverity(severity) ||
    !createdAt
  ) {
    return null;
  }

  return {
    id,
    publicCode,
    title,
    status,
    severity,
    areaName: readString(raw.areaName),
    contractorOrganizationName: readString(raw.contractorOrganizationName),
    createdAt,
    createdByName: readString(raw.createdByName),
  };
}

export function mapListOperationalOccurrencesResult(
  raw: unknown,
): ListOperationalOccurrencesResult {
  if (!isRecord(raw)) {
    return { items: [], nextCursor: null, hasNext: false };
  }

  const items: OccurrenceSummary[] = [];

  if (Array.isArray(raw.items)) {
    for (const entry of raw.items) {
      const mapped = mapOccurrenceSummary(entry);
      if (mapped !== null) {
        items.push(mapped);
      }
    }
  }

  return {
    items,
    nextCursor: readCursor(raw.nextCursor),
    hasNext: readBoolean(raw.hasNext, false),
  };
}

export const OPERATIONAL_OCCURRENCE_LIST_RPC_ERROR_CODES = [
  "UNAUTHORIZED",
  "ORGANIZATION_NOT_ALLOWED",
  "FORBIDDEN",
  "VALIDATION_ERROR",
  "UNKNOWN",
] as const;

export type OperationalOccurrenceListRpcErrorCode =
  (typeof OPERATIONAL_OCCURRENCE_LIST_RPC_ERROR_CODES)[number];

type OperationalOccurrenceListRpcErrorLike = {
  message?: string | null;
  code?: string | null;
};

/**
 * A RPC levanta RAISE EXCEPTION (não envelope `{ success: false }`).
 * SQLSTATE 42501 é compartilhado por ORGANIZATION_NOT_ALLOWED e FORBIDDEN —
 * a distinção é o prefixo de `error.message` (contrato real da migration).
 */
export function parseOperationalOccurrenceListRpcErrorCode(
  error: OperationalOccurrenceListRpcErrorLike | null | undefined,
): OperationalOccurrenceListRpcErrorCode {
  const message = error?.message ?? "";

  if (message.startsWith("ORGANIZATION_NOT_ALLOWED")) {
    return "ORGANIZATION_NOT_ALLOWED";
  }

  if (message.startsWith("FORBIDDEN")) {
    return "FORBIDDEN";
  }

  if (message.startsWith("UNAUTHORIZED")) {
    return "UNAUTHORIZED";
  }

  if (message.startsWith("VALIDATION_ERROR")) {
    return "VALIDATION_ERROR";
  }

  return "UNKNOWN";
}

const OPERATIONAL_OCCURRENCE_LIST_RPC_SAFE_MESSAGES: Record<
  OperationalOccurrenceListRpcErrorCode,
  string
> = {
  UNAUTHORIZED: "Sessão expirada. Faça login novamente.",
  ORGANIZATION_NOT_ALLOWED: "Você não tem acesso a esta organização.",
  FORBIDDEN: "Você não possui permissão para listar Paralisações Preventivas.",
  VALIDATION_ERROR: "Verifique os filtros informados e tente novamente.",
  UNKNOWN: "Não foi possível carregar a lista. Tente novamente mais tarde.",
};

export function getOperationalOccurrenceListRpcSafeMessage(
  error: OperationalOccurrenceListRpcErrorLike | null | undefined,
): string {
  return OPERATIONAL_OCCURRENCE_LIST_RPC_SAFE_MESSAGES[
    parseOperationalOccurrenceListRpcErrorCode(error)
  ];
}

export class OperationalOccurrenceListRpcError extends Error {
  readonly code: OperationalOccurrenceListRpcErrorCode;

  constructor(error: OperationalOccurrenceListRpcErrorLike | null | undefined) {
    const code = parseOperationalOccurrenceListRpcErrorCode(error);
    super(OPERATIONAL_OCCURRENCE_LIST_RPC_SAFE_MESSAGES[code]);
    this.name = "OperationalOccurrenceListRpcError";
    this.code = code;
  }
}

/** Defesa em profundidade — RPC ainda não migrada no ambiente. */
export function isOperationalOccurrenceListRpcUnavailableError(error: unknown): boolean {
  if (!isRecord(error)) {
    return false;
  }

  const code = typeof error.code === "string" ? error.code : "";
  return code === "PGRST202" || code === "42883";
}

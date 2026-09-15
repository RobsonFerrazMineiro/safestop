import type { OccurrenceDecision } from "./occurrence-decision";
import type {
  OccurrenceDecisionType,
  OccurrenceSeverity,
  OccurrenceStatus,
} from "./occurrence-status";

/**
 * Resumo para listagem (DTO de aplicação, camelCase).
 */
export type OccurrenceSummary = {
  id: string;
  publicCode: string;
  title: string;
  status: OccurrenceStatus;
  severity: OccurrenceSeverity;
  areaName: string | null;
  contractorOrganizationName: string | null;
  createdAt: string;
  createdByName: string | null;
};

/**
 * Detalhe completo da ocorrência (fundação 2.0 — sem módulos satélite).
 */
export type OccurrenceDetails = OccurrenceSummary & {
  taskDescription: string;
  locationDescription: string;
  conditionDescription: string;
  immediateActionDescription: string | null;
  decisionType: OccurrenceDecisionType | null;
  latitude: number | null;
  longitude: number | null;
  locationAccuracy: number | null;
  occurredAt: string;
  stoppedAt: string | null;
  organizationId: string;
  /** Gate 13A+ — null = legado sem Workspace. */
  workspaceId: string | null;
  /** Gate 13X.2 — EMPRESA originadora; preenchido no servidor. */
  originOrganizationId: string | null;
  originOrganizationName: string | null;
  areaId: string;
  unitId: string | null;
  contractId: string | null;
  contractorOrganizationId: string | null;
  createdBy: string;
  evaluatedAt: string | null;
  releasedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
  /** Avaliador atribuído no start (Sprint 2.4). */
  assignedEvaluatorId: string | null;
  assignedEvaluatorName: string | null;
  /** Decisão vigente 1:1 — embed occurrence_decisions (Sprint 2.4). */
  decision: OccurrenceDecision | null;
  /** Referência IMS manual (Sprint 2.8). */
  imsReferenceCode: string | null;
  imsReferenceRegisteredAt: string | null;
  imsReferenceRegisteredBy: string | null;
  imsReferenceRegisteredByName: string | null;
  imsReferenceUpdatedAt: string | null;
  imsReferenceUpdatedBy: string | null;
  imsReferenceUpdatedByName: string | null;
};

/**
 * Entrada do histórico de status (imutável após inserção).
 */
export type OccurrenceStatusHistoryEntry = {
  id: string;
  fromStatus: OccurrenceStatus | null;
  toStatus: OccurrenceStatus;
  changedBy: string;
  changedAt: string;
  metadata: Record<string, unknown> | null;
};

/**
 * Filtros opcionais da listagem tenant-scoped (lista operacional).
 * Não misturar com OccurrenceReportFilters (`list_occurrences_report`).
 *
 * Paginação e busca textual são consumidas por `list_operational_occurrences`
 * (PR-D1 / PO-UX-10). `getOccurrences` PostgREST ainda ignora search/área/
 * contratada/paginação até o wiring da lista (fora de D1.2).
 */
export type OccurrenceListFilters = {
  status?: OccurrenceStatus[];
  /** Criticidade única na UI — o builder envia `p_severity` como array de 1. */
  severity?: OccurrenceSeverity;
  /** Contains normalizado — PO-IMS-10 (Sprint 2.8). */
  imsReferenceCode?: string;
  /** Contains case-insensitive nos campos da RPC (não só public_code). */
  search?: string;
  areaId?: string;
  contractorOrganizationId?: string;
  /**
   * Gate 13C.1 — contexto Workspace opcional (`p_workspace_id`).
   * Omitido/undefined ⇒ NULL na RPC (legado Organization-scoped).
   * Consumo Web obrigatório = Gate 13C.2.
   */
  workspaceId?: string;
  pagination?: {
    cursor?: { sortValue: string; id: string } | null;
    limit?: number;
  };
};

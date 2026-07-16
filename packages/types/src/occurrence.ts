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
  areaId: string;
  unitId: string | null;
  contractId: string | null;
  contractorOrganizationId: string | null;
  createdBy: string;
  evaluatedAt: string | null;
  releasedAt: string | null;
  closedAt: string | null;
  cancelledAt: string | null;
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
 * Filtros opcionais da listagem tenant-scoped.
 */
export type OccurrenceListFilters = {
  status?: OccurrenceStatus;
  severity?: OccurrenceSeverity;
};

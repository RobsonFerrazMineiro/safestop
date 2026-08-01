import type { OccurrenceSeverity, OccurrenceStatus } from "./occurrence-status";

/**
 * Status exibidos na listagem de Paralisação Preventiva (Sprint 2.1 — A-R5).
 * Subconjunto de OCCURRENCE_STATUSES; apenas PP aberta nesta sprint.
 */
export const PREVENTIVE_STOP_STATUSES = ["PARALISACAO_PREVENTIVA"] as const;

export type PreventiveStopStatus = (typeof PREVENTIVE_STOP_STATUSES)[number];

export const PREVENTIVE_STOP_DEFAULT_STATUS: PreventiveStopStatus = "PARALISACAO_PREVENTIVA";

/**
 * Título derivado de task_description (docs/decisions/PREVENTIVE-STOP-DECISIONS.md A-R3).
 */
export const PREVENTIVE_STOP_TITLE_MAX_LENGTH = 200;

export function isPreventiveStopStatus(value: string): value is PreventiveStopStatus {
  return (PREVENTIVE_STOP_STATUSES as readonly string[]).includes(value);
}

/**
 * Filtro padrão da listagem PP na Sprint 2.1.
 */
export const PREVENTIVE_STOP_LIST_FILTER_STATUSES: readonly OccurrenceStatus[] =
  PREVENTIVE_STOP_STATUSES;

/**
 * Filtros da listagem PP (A-R5).
 */
export type PreventiveStopListFilters = {
  status?: PreventiveStopStatus[];
  severity?: OccurrenceSeverity;
};

/**
 * Opção de contratada retornada por list_organization_contractors (SW-03).
 */
export type OrganizationContractorOption = {
  contractorOrganizationId: string;
  contractorName: string;
};

/**
 * Opção de contrato retornada por list_organization_contracts (SW-04).
 */
export type OrganizationContractOption = {
  contractId: string;
  contractNumber: string | null;
  name: string;
  contractorOrganizationId: string;
  unitId: string | null;
};

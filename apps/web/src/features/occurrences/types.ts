import type {
  OccurrenceDetails,
  OccurrenceSeverity,
  OccurrenceStatus,
  OccurrenceSummary,
} from "@safestop/types";
import { occurrenceQueryKeys } from "@safestop/query-keys";

export { occurrenceQueryKeys };

/** Lista tenant-scoped — 30s (OCCURRENCE-FOUNDATION-DECISIONS.md). */
export const OCCURRENCE_LIST_STALE_TIME_MS = 30_000;

/** Detalhe tenant-scoped — 60s (OCCURRENCE-FOUNDATION-DECISIONS.md). */
export const OCCURRENCE_DETAIL_STALE_TIME_MS = 60_000;

/** Histórico de status — 5min (OCCURRENCE-FOUNDATION-DECISIONS.md). */
export const OCCURRENCE_STATUS_HISTORY_STALE_TIME_MS = 5 * 60 * 1000;

export type OrganizationAreaOption = {
  id: string;
  name: string;
  code: string | null;
};

export type CreateOccurrenceResult = {
  id: string;
  publicCode: string;
  status: string;
};

export type OccurrenceSummaryEnriched = {
  id: string;
  publicCode: string;
  title: string;
  status: OccurrenceStatus;
  severity: OccurrenceSeverity;
  areaName: string | null;
  areaId: string;
  unitId: string | null;
  contractId: string | null;
  managementDepartmentId: string | null;
  workspaceId: string | null;
  originOrganizationId: string | null;
  originOrganizationName: string | null;
  createdAt: string;
  createdByName: string | null;
  contractorOrganizationName: string | null;
};

export type OccurrenceDetailsEnriched = OccurrenceSummaryEnriched &
  Omit<OccurrenceDetails, keyof OccurrenceSummary>;

export type ContractorOrganizationOption = {
  id: string;
  name: string;
};

/** Contrato ativo do Ambiente (picker do create — Gate 13X.3). */
export type WorkspaceContractOption = {
  id: string;
  name: string;
  contractNumber: string | null;
  contractorOrganizationId: string;
  contractorOrganizationName: string;
};

export type OccurrenceStatusHistoryItem = {
  id: string;
  fromStatus: OccurrenceStatus | null;
  toStatus: OccurrenceStatus;
  changedAt: string;
  changedByName: string | null;
};

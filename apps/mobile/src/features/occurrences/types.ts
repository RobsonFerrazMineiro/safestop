import type { OccurrenceListFilters } from "@safestop/types";
import { occurrenceQueryKeys } from "@safestop/query-keys";

export { occurrenceQueryKeys };

/** Lista tenant-scoped — 30s (OCCURRENCE-FOUNDATION-DECISIONS.md). */
export const OCCURRENCE_LIST_STALE_TIME_MS = 30_000;

export type OccurrenceAreaOption = {
  id: string;
  name: string;
  code: string | null;
};

export type OccurrenceContractorOption = {
  id: string;
  name: string;
};

export type OccurrenceContractOption = {
  id: string;
  contractNumber: string | null;
  name: string;
};

/** Contrato ativo do Ambiente (picker do create — Gate 13X.4). */
export type WorkspaceContractOption = {
  id: string;
  name: string;
  contractNumber: string | null;
  contractorOrganizationId: string;
  contractorOrganizationName: string;
};

export type OccurrenceSyncStatus = "saved_locally" | "registered_on_server";

export type { OccurrenceListFilters };

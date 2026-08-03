import type { OccurrenceListFilters } from "@safestop/types";
import { occurrenceQueryKeys } from "@safestop/query-keys";

export { occurrenceQueryKeys };

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

export type OccurrenceSyncStatus = "saved_locally" | "registered_on_server";

export type { OccurrenceListFilters };

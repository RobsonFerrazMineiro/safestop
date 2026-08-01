import { PREVENTIVE_STOP_LIST_FILTER_STATUSES } from "@safestop/types";
import type { OccurrenceListFilters } from "@safestop/types";

export const PREVENTIVE_STOP_LIST_FILTERS = {
  status: [...PREVENTIVE_STOP_LIST_FILTER_STATUSES],
} satisfies OccurrenceListFilters;

export const PREVENTIVE_STOP_STATUS = "PARALISACAO_PREVENTIVA" as const;

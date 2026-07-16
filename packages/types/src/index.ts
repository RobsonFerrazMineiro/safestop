// Supabase-generated types (packages/types/src/database.types.ts) must never
// be edited manually — see docs/engineering.md §17.16 and
// .cursor/rules/004-supabase.mdc. Re-exported here so apps consume the
// database schema exclusively through this package.
export type { Database, Json } from "./database.types";
export { PERMISSION_CODES, isPermissionCode } from "./permission-codes";
export type { PermissionCode } from "./permission-codes";

export {
  OCCURRENCE_DECISION_TYPES,
  OCCURRENCE_SEVERITIES,
  OCCURRENCE_STATUSES,
  OCCURRENCE_SYNC_STATES,
  isOccurrenceDecisionType,
  isOccurrenceSeverity,
  isOccurrenceStatus,
} from "./occurrence-status";
export type {
  OccurrenceDecisionType,
  OccurrenceSeverity,
  OccurrenceStatus,
  OccurrenceSyncState,
} from "./occurrence-status";

export type {
  OccurrenceDetails,
  OccurrenceListFilters,
  OccurrenceStatusHistoryEntry,
  OccurrenceSummary,
} from "./occurrence";

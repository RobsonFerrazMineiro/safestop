// Supabase-generated types (packages/types/src/database.types.ts) must never
// be edited manually — see docs/engineering.md §17.16 and
// .cursor/rules/004-supabase.mdc. Re-exported here so apps consume the
// database schema exclusively through this package.
export type { Database, Json } from "./database.types";
export { PERMISSION_CODES, isPermissionCode } from "./permission-codes";
export type { PermissionCode } from "./permission-codes";

// Domain-level types and DTOs (Occurrence, User, Organization, etc.) will be
// added when the corresponding features are implemented, following the
// SafeStop roadmap. They must be defined separately from the generated
// database types above, never by editing database.types.ts.

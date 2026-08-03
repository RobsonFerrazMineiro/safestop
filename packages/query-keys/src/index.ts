export { HSE_APPROVAL_SCOPE, OCCURRENCES_SCOPE, TENANT_QUERY_KEY_PREFIX } from "./tenant";

export { occurrenceQueryKeys } from "./occurrence";

export { hseApprovalQueryKeys } from "./hse-approval";

export {
  getOccurrenceInvalidationTargets,
  OCCURRENCE_INVALIDATION_MATRIX,
  OCCURRENCE_INVALIDATION_TARGETS,
  OCCURRENCE_MUTATION_DOMAINS,
  resolveOccurrenceInvalidationKeys,
} from "./invalidation-matrix";
export type { OccurrenceInvalidationTarget, OccurrenceMutationDomain } from "./invalidation-matrix";

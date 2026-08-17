export { HSE_APPROVAL_SCOPE, OCCURRENCES_SCOPE, TENANT_QUERY_KEY_PREFIX } from "./tenant";

export { occurrenceQueryKeys } from "./occurrence";

export { hseApprovalQueryKeys } from "./hse-approval";

export { actionPlanKeys, ACTION_PLAN_SCOPE } from "./action-plan";

export {
  getActionPlanInvalidationTargets,
  ACTION_PLAN_INVALIDATION_MATRIX,
  ACTION_PLAN_INVALIDATION_TARGETS,
  ACTION_PLAN_MUTATION_DOMAINS,
  resolveActionPlanInvalidationKeys,
} from "./action-plan-invalidation";
export type {
  ActionPlanInvalidationScope,
  ActionPlanInvalidationTarget,
  ActionPlanMutationDomain,
} from "./action-plan-invalidation";

export {
  getOccurrenceInvalidationTargets,
  OCCURRENCE_INVALIDATION_MATRIX,
  OCCURRENCE_INVALIDATION_TARGETS,
  OCCURRENCE_MUTATION_DOMAINS,
  resolveOccurrenceInvalidationKeys,
} from "./invalidation-matrix";
export type { OccurrenceInvalidationTarget, OccurrenceMutationDomain } from "./invalidation-matrix";

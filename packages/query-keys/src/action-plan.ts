import { TENANT_QUERY_KEY_PREFIX } from "./tenant";

export const ACTION_PLAN_SCOPE = "action-plan" as const;

/**
 * Query keys tenant-scoped do Plano de Ação (Sprint 3.0).
 */
export const actionPlanKeys = {
  all: (organizationId: string) =>
    [TENANT_QUERY_KEY_PREFIX, organizationId, ACTION_PLAN_SCOPE] as const,
  byOccurrence: (organizationId: string, occurrenceId: string) =>
    [...actionPlanKeys.all(organizationId), "occurrence", occurrenceId] as const,
  items: (organizationId: string, planId: string) =>
    [...actionPlanKeys.all(organizationId), "plan", planId, "items"] as const,
  item: (organizationId: string, itemId: string) =>
    [...actionPlanKeys.all(organizationId), "item", itemId] as const,
  attachments: (organizationId: string, itemId: string) =>
    [...actionPlanKeys.item(organizationId, itemId), "attachments"] as const,
};

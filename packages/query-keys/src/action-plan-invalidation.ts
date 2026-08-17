/**
 * Invalidação pós-mutation — Plano de Ação (Sprint 3.0).
 *
 * | Domínio  | byOccurrence | items | item | attachments | detail | timeline |
 * |----------|--------------|-------|------|-------------|--------|----------|
 * | plan     |      ✓       |   ✓   |      |             |   ✓    |    ✓     |
 * | item     |      ✓       |   ✓   |  ✓   |             |   ✓    |    ✓     |
 * | evidence |              |       |  ✓   |      ✓      |        |    ✓     |
 */

import { actionPlanKeys } from "./action-plan";
import { occurrenceQueryKeys } from "./occurrence";

export const ACTION_PLAN_MUTATION_DOMAINS = ["plan", "item", "evidence"] as const;

export type ActionPlanMutationDomain = (typeof ACTION_PLAN_MUTATION_DOMAINS)[number];

export const ACTION_PLAN_INVALIDATION_TARGETS = [
  "actionPlanByOccurrence",
  "actionPlanItems",
  "actionPlanItem",
  "actionPlanAttachments",
  "detail",
  "timeline",
] as const;

export type ActionPlanInvalidationTarget = (typeof ACTION_PLAN_INVALIDATION_TARGETS)[number];

export const ACTION_PLAN_INVALIDATION_MATRIX: Record<
  ActionPlanMutationDomain,
  readonly ActionPlanInvalidationTarget[]
> = {
  plan: ["actionPlanByOccurrence", "actionPlanItems", "detail", "timeline"],
  item: ["actionPlanByOccurrence", "actionPlanItems", "actionPlanItem", "detail", "timeline"],
  evidence: ["actionPlanAttachments", "actionPlanItem", "timeline"],
};

export type ActionPlanInvalidationScope = {
  organizationId: string;
  occurrenceId: string;
  planId?: string;
  itemId?: string;
};

export function getActionPlanInvalidationTargets(
  domain: ActionPlanMutationDomain,
): readonly ActionPlanInvalidationTarget[] {
  return ACTION_PLAN_INVALIDATION_MATRIX[domain];
}

export function resolveActionPlanInvalidationKeys(
  scope: ActionPlanInvalidationScope,
  targets: readonly ActionPlanInvalidationTarget[],
): readonly (readonly unknown[])[] {
  const keys: (readonly unknown[])[] = [];

  for (const target of targets) {
    switch (target) {
      case "actionPlanByOccurrence":
        keys.push(actionPlanKeys.byOccurrence(scope.organizationId, scope.occurrenceId));
        break;
      case "actionPlanItems":
        if (scope.planId) {
          keys.push(actionPlanKeys.items(scope.organizationId, scope.planId));
        }
        break;
      case "actionPlanItem":
        if (scope.itemId) {
          keys.push(actionPlanKeys.item(scope.organizationId, scope.itemId));
        }
        break;
      case "actionPlanAttachments":
        if (scope.itemId) {
          keys.push(actionPlanKeys.attachments(scope.organizationId, scope.itemId));
        }
        break;
      case "detail":
        keys.push(occurrenceQueryKeys.detail(scope.organizationId, scope.occurrenceId));
        break;
      case "timeline":
        keys.push(occurrenceQueryKeys.timeline(scope.organizationId, scope.occurrenceId));
        break;
      default: {
        const _exhaustive: never = target;
        return _exhaustive;
      }
    }
  }

  return keys;
}

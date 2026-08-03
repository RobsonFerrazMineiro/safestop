/**
 * PO-CON-9 — Matriz de invalidação pós-mutation (Sprint 2.9).
 *
 * Domínios: decision · mdho · hse · ims · timeline · list · create
 *
 * | Domínio  | detail | lists | timeline | statusHistory | decision | mdho | hseQueue |
 * |----------|--------|-------|----------|---------------|----------|------|----------|
 * | decision |   ✓    |   ✓   |    ✓     |       ✓       |    ✓     |      |          |
 * | mdho     |   ✓    |   ✓   |    ✓     |       ✓       |          |  ✓   |          |
 * | hse      |   ✓    |   ✓   |    ✓     |       ✓       |          |  ✓   |    ✓     |
 * | ims      |   ✓    |   ✓   |    ✓     |       ✓       |          |      |          |
 * | timeline |        |       |    ✓     |               |          |      |          |
 * | list     |        |   ✓   |          |               |          |      |          |
 * | create   |   ✓    |   ✓   |          |               |          |      |          |
 */

import { hseApprovalQueryKeys } from "./hse-approval";
import { occurrenceQueryKeys } from "./occurrence";

export const OCCURRENCE_MUTATION_DOMAINS = [
  "decision",
  "mdho",
  "hse",
  "ims",
  "timeline",
  "list",
  "create",
] as const;

export type OccurrenceMutationDomain = (typeof OCCURRENCE_MUTATION_DOMAINS)[number];

export const OCCURRENCE_INVALIDATION_TARGETS = [
  "detail",
  "lists",
  "timeline",
  "statusHistory",
  "decision",
  "mdho",
  "hseQueue",
] as const;

export type OccurrenceInvalidationTarget = (typeof OCCURRENCE_INVALIDATION_TARGETS)[number];

export const OCCURRENCE_INVALIDATION_MATRIX: Record<
  OccurrenceMutationDomain,
  readonly OccurrenceInvalidationTarget[]
> = {
  decision: ["detail", "lists", "timeline", "statusHistory", "decision"],
  mdho: ["detail", "lists", "timeline", "statusHistory", "mdho"],
  hse: ["detail", "lists", "timeline", "statusHistory", "mdho", "hseQueue"],
  ims: ["detail", "lists", "timeline", "statusHistory"],
  timeline: ["timeline"],
  list: ["lists"],
  create: ["lists", "detail"],
};

export function getOccurrenceInvalidationTargets(
  domain: OccurrenceMutationDomain,
): readonly OccurrenceInvalidationTarget[] {
  return OCCURRENCE_INVALIDATION_MATRIX[domain];
}

export function resolveOccurrenceInvalidationKeys(
  organizationId: string,
  occurrenceId: string,
  targets: readonly OccurrenceInvalidationTarget[],
): readonly (readonly unknown[])[] {
  const keys: (readonly unknown[])[] = [];

  for (const target of targets) {
    switch (target) {
      case "detail":
        keys.push(occurrenceQueryKeys.detail(organizationId, occurrenceId));
        break;
      case "lists":
        keys.push(occurrenceQueryKeys.lists(organizationId));
        break;
      case "timeline":
        keys.push(occurrenceQueryKeys.timeline(organizationId, occurrenceId));
        break;
      case "statusHistory":
        keys.push(occurrenceQueryKeys.statusHistory(organizationId, occurrenceId));
        break;
      case "decision":
        keys.push(occurrenceQueryKeys.decision(organizationId, occurrenceId));
        break;
      case "mdho":
        keys.push(occurrenceQueryKeys.mdho(organizationId, occurrenceId));
        break;
      case "hseQueue":
        keys.push(hseApprovalQueryKeys.queue(organizationId));
        break;
      default: {
        const _exhaustive: never = target;
        return _exhaustive;
      }
    }
  }

  return keys;
}

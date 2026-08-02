import type { OccurrenceDetailsEnriched } from "@/features/occurrences/types";

export type InterdicaoOccurrence = Pick<
  OccurrenceDetailsEnriched,
  "id" | "status" | "decision" | "decisionType"
>;

export type InterdicaoContext = {
  canConfirmInterdiction: boolean;
  showSummary: boolean;
  shouldRenderSection: boolean;
  hasDecision: boolean;
  isOffline: boolean;
};

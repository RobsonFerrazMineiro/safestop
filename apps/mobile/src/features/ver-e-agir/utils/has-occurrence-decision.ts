import type { OccurrenceDecision, OccurrenceDecisionType } from "@safestop/types";

type OccurrenceDecisionSource = {
  decision: OccurrenceDecision | null;
  decisionType: OccurrenceDecisionType | null;
};

const VIGENT_DECISION_TYPES: OccurrenceDecisionType[] = ["VER_E_AGIR", "INTERDICAO_OFICIAL"];

export function hasOccurrenceDecision(occurrence: OccurrenceDecisionSource): boolean {
  if (occurrence.decision !== null) {
    return true;
  }

  return (
    occurrence.decisionType !== null && VIGENT_DECISION_TYPES.includes(occurrence.decisionType)
  );
}

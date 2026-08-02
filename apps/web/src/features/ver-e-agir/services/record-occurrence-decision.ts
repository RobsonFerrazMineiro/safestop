import type { RecordVerEAgirDecisionResult } from "@safestop/types";
import { recordVerEAgirDecisionSchema } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";

import { assertRpcDataOrThrow, mapRecordOccurrenceDecisionResult } from "./map-decision-result";

type RecordDecisionRpcData = {
  decision: {
    id: string;
    occurrence_id: string;
    decision_type: string;
    decision_reason: string;
    decided_by: string;
    decided_at: string;
  };
  occurrence: {
    id: string;
    status: string;
    decision_type: string;
    evaluated_at: string;
  };
};

export async function recordOccurrenceDecision(input: {
  occurrenceId: string;
  decisionReason: string;
}): Promise<RecordVerEAgirDecisionResult> {
  const validated = recordVerEAgirDecisionSchema.parse(input);

  const supabase = createClient();

  const { data, error } = await supabase.rpc("record_occurrence_decision", {
    p_payload: {
      occurrence_id: validated.occurrenceId,
      decision_type: "VER_E_AGIR",
      decision_reason: validated.decisionReason,
    },
  });

  if (error) {
    throw new Error("Não foi possível registrar a decisão.");
  }

  const payload = assertRpcDataOrThrow<RecordDecisionRpcData>(
    data,
    "Não foi possível registrar a decisão.",
  );

  return mapRecordOccurrenceDecisionResult(payload);
}

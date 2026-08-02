import type { RecordInterdicaoDecisionResult } from "@safestop/types";
import { recordInterdicaoDecisionSchema } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";
import { assertRpcDataOrThrow } from "@/features/occurrences/utils/occurrence-decision-rpc";

import { mapInterdicaoDecisionResult } from "./map-interdicao-result";

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

export async function recordInterdicaoDecision(input: {
  occurrenceId: string;
  decisionReason: string;
}): Promise<RecordInterdicaoDecisionResult> {
  const validated = recordInterdicaoDecisionSchema.parse(input);

  const supabase = createClient();

  const { data, error } = await supabase.rpc("record_occurrence_decision", {
    p_payload: {
      occurrence_id: validated.occurrenceId,
      decision_type: "INTERDICAO_OFICIAL",
      decision_reason: validated.decisionReason,
    },
  });

  if (error) {
    throw new Error("Não foi possível confirmar a interdição.");
  }

  const payload = assertRpcDataOrThrow<RecordDecisionRpcData>(
    data,
    "Não foi possível confirmar a interdição.",
  );

  return mapInterdicaoDecisionResult(payload);
}

import type { RecordVerEAgirDecisionResult } from "@safestop/types";
import { recordVerEAgirDecisionSchema } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapRecordVerEAgirDecisionResult } from "./map-evaluation-rpc";
import { parseEvaluationRpcError } from "../utils/evaluation-errors";

type RpcRecordDecisionResponse = {
  success: boolean;
  data?: Parameters<typeof mapRecordVerEAgirDecisionResult>[0];
};

export async function recordOccurrenceDecision(
  occurrenceId: string,
  decisionReason: string,
): Promise<RecordVerEAgirDecisionResult> {
  const input = recordVerEAgirDecisionSchema.parse({ occurrenceId, decisionReason });
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("record_occurrence_decision", {
    p_payload: {
      occurrence_id: input.occurrenceId,
      decision_type: "VER_E_AGIR",
      decision_reason: input.decisionReason,
    },
  });

  if (error) {
    throw new Error("Não foi possível registrar a decisão.");
  }

  const response = data as RpcRecordDecisionResponse;

  if (!response.success || !response.data) {
    throw parseEvaluationRpcError(data, "Não foi possível registrar a decisão.");
  }

  return mapRecordVerEAgirDecisionResult(response.data);
}

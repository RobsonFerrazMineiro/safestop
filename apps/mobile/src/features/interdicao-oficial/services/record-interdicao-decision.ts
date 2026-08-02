import type { RecordInterdicaoDecisionResult } from "@safestop/types";
import { recordInterdicaoDecisionSchema } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";
import { mapRecordVerEAgirDecisionResult } from "@/features/ver-e-agir/services/map-evaluation-rpc";
import { parseEvaluationRpcError } from "@/features/ver-e-agir/utils/evaluation-errors";

type RpcRecordDecisionResponse = {
  success: boolean;
  data?: Parameters<typeof mapRecordVerEAgirDecisionResult>[0];
};

export async function recordInterdicaoDecision(
  occurrenceId: string,
  decisionReason: string,
): Promise<RecordInterdicaoDecisionResult> {
  const input = recordInterdicaoDecisionSchema.parse({ occurrenceId, decisionReason });
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("record_occurrence_decision", {
    p_payload: {
      occurrence_id: input.occurrenceId,
      decision_type: "INTERDICAO_OFICIAL",
      decision_reason: input.decisionReason,
    },
  });

  if (error) {
    throw new Error("Não foi possível confirmar a Interdição Oficial.");
  }

  const response = data as RpcRecordDecisionResponse;

  if (!response.success || !response.data) {
    throw parseEvaluationRpcError(data, "Não foi possível confirmar a Interdição Oficial.");
  }

  return mapRecordVerEAgirDecisionResult(response.data);
}

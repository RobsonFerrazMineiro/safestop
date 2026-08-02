import type { OccurrenceTransitionResult } from "@safestop/types";
import { startEvaluationSchema } from "@safestop/validation";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapStartEvaluationResult } from "./map-evaluation-rpc";
import { parseEvaluationRpcError } from "../utils/evaluation-errors";

type RpcStartEvaluationResponse = {
  success: boolean;
  data?: Parameters<typeof mapStartEvaluationResult>[0];
};

export async function startOccurrenceEvaluation(
  occurrenceId: string,
): Promise<OccurrenceTransitionResult> {
  const input = startEvaluationSchema.parse({ occurrenceId });
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("start_occurrence_evaluation", {
    p_occurrence_id: input.occurrenceId,
  });

  if (error) {
    throw new Error("Não foi possível iniciar a avaliação.");
  }

  const response = data as RpcStartEvaluationResponse;

  if (!response.success || !response.data) {
    throw parseEvaluationRpcError(data, "Não foi possível iniciar a avaliação.");
  }

  return mapStartEvaluationResult(response.data);
}

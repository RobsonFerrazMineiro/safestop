import type { OccurrenceTransitionResult } from "@safestop/types";
import { startEvaluationSchema } from "@safestop/validation";

import { createClient } from "@/lib/auth/client";

import { assertRpcDataOrThrow, mapStartEvaluationResult } from "./map-decision-result";

type StartEvaluationRpcData = {
  occurrence_id: string;
  previous_status: string;
  current_status: string;
  assigned_evaluator_id: string;
  transitioned_at: string;
};

export async function startOccurrenceEvaluation(
  occurrenceId: string,
): Promise<OccurrenceTransitionResult> {
  startEvaluationSchema.parse({ occurrenceId });

  const supabase = createClient();

  const { data, error } = await supabase.rpc("start_occurrence_evaluation", {
    p_occurrence_id: occurrenceId,
  });

  if (error) {
    throw new Error("Não foi possível iniciar a avaliação.");
  }

  const payload = assertRpcDataOrThrow<StartEvaluationRpcData>(
    data,
    "Não foi possível iniciar a avaliação.",
  );

  return mapStartEvaluationResult(payload);
}

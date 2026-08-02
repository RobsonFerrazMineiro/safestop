import type { OccurrenceTransitionResult, RecordVerEAgirDecisionResult } from "@safestop/types";
import { isOccurrenceStatus } from "@safestop/types";

import {
  assertRpcDataOrThrow,
  mapRecordOccurrenceDecisionResult,
} from "@/features/occurrences/utils/occurrence-decision-rpc";

export {
  assertRpcDataOrThrow,
  mapRecordOccurrenceDecisionResult,
  mapRecordOccurrenceDecisionResult as mapRecordVerEAgirDecisionResult,
};

type StartEvaluationRpcData = {
  occurrence_id: string;
  previous_status: string;
  current_status: string;
  assigned_evaluator_id: string;
  transitioned_at: string;
};

export function mapStartEvaluationResult(data: StartEvaluationRpcData): OccurrenceTransitionResult {
  if (!isOccurrenceStatus(data.previous_status) || !isOccurrenceStatus(data.current_status)) {
    throw new Error("Resposta inválida ao iniciar avaliação.");
  }

  return {
    occurrenceId: data.occurrence_id,
    previousStatus: data.previous_status,
    currentStatus: data.current_status,
    assignedEvaluatorId: data.assigned_evaluator_id,
    transitionedAt: data.transitioned_at,
  };
}

export type { RecordVerEAgirDecisionResult };

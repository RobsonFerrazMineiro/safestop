import {
  isOccurrenceDecisionType,
  isOccurrenceStatus,
  type OccurrenceDecision,
  type OccurrenceTransitionResult,
  type RecordVerEAgirDecisionOccurrenceSnapshot,
  type RecordVerEAgirDecisionResult,
} from "@safestop/types";

type RpcStartEvaluationData = {
  occurrence_id: string;
  previous_status: string;
  current_status: string;
  assigned_evaluator_id: string;
  transitioned_at: string;
};

type RpcRecordDecisionPayload = {
  id: string;
  occurrence_id: string;
  decision_type: string;
  decision_reason: string;
  decided_by: string;
  decided_at: string;
};

type RpcRecordOccurrencePayload = {
  id: string;
  status: string;
  decision_type: string;
  evaluated_at: string;
};

type RpcRecordDecisionData = {
  decision: RpcRecordDecisionPayload;
  occurrence: RpcRecordOccurrencePayload;
};

export function mapStartEvaluationResult(data: RpcStartEvaluationData): OccurrenceTransitionResult {
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

export function mapRecordVerEAgirDecisionResult(
  data: RpcRecordDecisionData,
): RecordVerEAgirDecisionResult {
  if (!isOccurrenceDecisionType(data.decision.decision_type)) {
    throw new Error("Resposta inválida ao registrar decisão.");
  }

  if (!isOccurrenceStatus(data.occurrence.status)) {
    throw new Error("Resposta inválida ao registrar decisão.");
  }

  const decision: OccurrenceDecision = {
    id: data.decision.id,
    occurrenceId: data.decision.occurrence_id,
    decisionType: data.decision.decision_type,
    decisionReason: data.decision.decision_reason,
    decidedBy: data.decision.decided_by,
    decidedByName: null,
    decidedAt: data.decision.decided_at,
    createdAt: data.decision.decided_at,
  };

  const occurrence: RecordVerEAgirDecisionOccurrenceSnapshot = {
    id: data.occurrence.id,
    status: data.occurrence.status,
    decisionType: data.decision.decision_type,
    evaluatedAt: data.occurrence.evaluated_at,
  };

  return { decision, occurrence };
}

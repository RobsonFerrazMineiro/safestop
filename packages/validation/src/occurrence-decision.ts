import {
  OCCURRENCE_DECISION_REASON_MAX_LENGTH,
  OCCURRENCE_DECISION_REASON_MIN_LENGTH,
} from "@safestop/types";
import { z } from "zod";

export const startEvaluationSchema = z.object({
  occurrenceId: z.string().uuid("Ocorrência é obrigatória."),
});

const decisionReasonSchema = z
  .string()
  .trim()
  .min(
    OCCURRENCE_DECISION_REASON_MIN_LENGTH,
    `Justificativa deve ter no mínimo ${OCCURRENCE_DECISION_REASON_MIN_LENGTH} caracteres.`,
  )
  .max(
    OCCURRENCE_DECISION_REASON_MAX_LENGTH,
    `Justificativa deve ter no máximo ${OCCURRENCE_DECISION_REASON_MAX_LENGTH} caracteres.`,
  );

export const recordVerEAgirDecisionSchema = z.object({
  occurrenceId: z.string().uuid("Ocorrência é obrigatória."),
  decisionReason: decisionReasonSchema,
});

export type StartEvaluationInput = z.infer<typeof startEvaluationSchema>;
export type RecordVerEAgirDecisionInput = z.infer<typeof recordVerEAgirDecisionSchema>;

export { OCCURRENCE_DECISION_REASON_MIN_LENGTH, OCCURRENCE_DECISION_REASON_MAX_LENGTH };

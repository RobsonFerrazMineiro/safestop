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

export const recordInterdicaoDecisionSchema = z.object({
  occurrenceId: z.string().uuid("Ocorrência é obrigatória."),
  decisionReason: decisionReasonSchema,
});

/** Payload RPC completo — apps injetam decision_type ao chamar record_occurrence_decision. */
export const recordOccurrenceDecisionSchema = z.object({
  occurrenceId: z.string().uuid("Ocorrência é obrigatória."),
  decisionType: z.enum(["VER_E_AGIR", "INTERDICAO_OFICIAL"], {
    errorMap: () => ({ message: "Tipo de decisão inválido." }),
  }),
  decisionReason: decisionReasonSchema,
});

export type StartEvaluationInput = z.infer<typeof startEvaluationSchema>;
export type RecordVerEAgirDecisionInput = z.infer<typeof recordVerEAgirDecisionSchema>;
export type RecordInterdicaoDecisionInput = z.infer<typeof recordInterdicaoDecisionSchema>;
export type RecordOccurrenceDecisionInput = z.infer<typeof recordOccurrenceDecisionSchema>;

export { OCCURRENCE_DECISION_REASON_MIN_LENGTH, OCCURRENCE_DECISION_REASON_MAX_LENGTH };

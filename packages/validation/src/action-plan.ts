import {
  ACTION_ITEM_CANCEL_REASON_MAX_LENGTH,
  ACTION_ITEM_CANCEL_REASON_MIN_LENGTH,
  ACTION_ITEM_COMPLETION_DESCRIPTION_MAX_LENGTH,
  ACTION_ITEM_VALIDATION_NOTE_MAX_LENGTH,
  ACTION_ITEM_VALIDATION_NOTE_MIN_LENGTH,
  ACTION_PLAN_SUMMARY_MAX_LENGTH,
  ACTION_PLAN_VALIDATION_OUTCOMES,
} from "@safestop/types";
import { z } from "zod";

const actionPlanSummarySchema = z
  .string()
  .trim()
  .max(
    ACTION_PLAN_SUMMARY_MAX_LENGTH,
    `Resumo deve ter no máximo ${ACTION_PLAN_SUMMARY_MAX_LENGTH} caracteres.`,
  )
  .optional();

export const createActionPlanSchema = z.object({
  occurrenceId: z.string().uuid("Ocorrência é obrigatória."),
  summary: actionPlanSummarySchema,
});

export const updateActionPlanSchema = z.object({
  planId: z.string().uuid("Plano é obrigatório."),
  summary: actionPlanSummarySchema,
});

export const submitActionItemSchema = z.object({
  itemId: z.string().uuid("Ação é obrigatória."),
  completionDescription: z
    .string()
    .trim()
    .max(
      ACTION_ITEM_COMPLETION_DESCRIPTION_MAX_LENGTH,
      `Descrição deve ter no máximo ${ACTION_ITEM_COMPLETION_DESCRIPTION_MAX_LENGTH} caracteres.`,
    )
    .optional(),
});

const actionPlanValidationOutcomeSchema = z.enum(ACTION_PLAN_VALIDATION_OUTCOMES, {
  errorMap: () => ({ message: "Resultado deve ser COMPLETED ou REJECTED." }),
});

export const validateActionItemSchema = z
  .object({
    itemId: z.string().uuid("Ação é obrigatória."),
    outcome: actionPlanValidationOutcomeSchema,
    note: z
      .string()
      .trim()
      .max(
        ACTION_ITEM_VALIDATION_NOTE_MAX_LENGTH,
        `Motivo deve ter no máximo ${ACTION_ITEM_VALIDATION_NOTE_MAX_LENGTH} caracteres.`,
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.outcome !== "REJECTED") {
      return;
    }

    const noteLength = data.note?.length ?? 0;

    if (noteLength < ACTION_ITEM_VALIDATION_NOTE_MIN_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Motivo da rejeição deve ter no mínimo ${ACTION_ITEM_VALIDATION_NOTE_MIN_LENGTH} caracteres.`,
        path: ["note"],
      });
    }
  });

export const cancelActionItemSchema = z.object({
  itemId: z.string().uuid("Ação é obrigatória."),
  reason: z
    .string()
    .trim()
    .min(
      ACTION_ITEM_CANCEL_REASON_MIN_LENGTH,
      `Motivo deve ter no mínimo ${ACTION_ITEM_CANCEL_REASON_MIN_LENGTH} caracteres.`,
    )
    .max(
      ACTION_ITEM_CANCEL_REASON_MAX_LENGTH,
      `Motivo deve ter no máximo ${ACTION_ITEM_CANCEL_REASON_MAX_LENGTH} caracteres.`,
    ),
});

export type CreateActionPlanInput = z.infer<typeof createActionPlanSchema>;
export type UpdateActionPlanInput = z.infer<typeof updateActionPlanSchema>;
export type SubmitActionItemInput = z.infer<typeof submitActionItemSchema>;
export type ValidateActionItemInput = z.infer<typeof validateActionItemSchema>;
export type CancelActionItemInput = z.infer<typeof cancelActionItemSchema>;

import { PREVENTIVE_STOP_TITLE_MAX_LENGTH } from "@safestop/types";
import { z } from "zod";

import { createOccurrenceSchema } from "./occurrence";

/**
 * Deriva o título persistido a partir da atividade (A-R3).
 */
export function buildPreventiveStopTitle(taskDescription: string): string {
  return taskDescription.trim().slice(0, PREVENTIVE_STOP_TITLE_MAX_LENGTH);
}

const preventiveStopBaseSchema = createOccurrenceSchema
  .omit({ title: true, contractorOrganizationId: true })
  .extend({
    contractorOrganizationId: z.string().uuid("Empresa envolvida é obrigatória."),
  });

/**
 * Formulário PP — sem campo title visível; título gerado antes do RPC (A-R3).
 * A-R6: taskDescription e conditionDescription obrigatórios;
 * immediateActionDescription opcional.
 */
export const createPreventiveStopSchema = preventiveStopBaseSchema.transform((input) => ({
  ...input,
  title: buildPreventiveStopTitle(input.taskDescription),
}));

export type CreatePreventiveStopInput = z.input<typeof createPreventiveStopSchema>;
export type CreatePreventiveStopPayload = z.output<typeof createPreventiveStopSchema>;

/**
 * Rascunho local PP — campos parciais (mobile).
 */
export const preventiveStopDraftSchema = preventiveStopBaseSchema.partial();

export type PreventiveStopDraftInput = z.infer<typeof preventiveStopDraftSchema>;

import {
  MDHO_COMPLEMENT_MAX_LENGTH,
  MDHO_DEVIATION_TYPE_CATEGORY_CODE,
  MDHO_OTHER_DETAIL_MIN_LENGTH,
  MDHO_OTHER_OPTION_CODE,
  MDHO_RETURN_REASON_MAX_LENGTH,
  MDHO_RETURN_REASON_MIN_LENGTH,
  type MdhoCatalogCategory,
  type MdhoSelectionInput,
} from "@safestop/types";
import { z } from "zod";

const mdhoSelectionInputSchema = z.object({
  categoryId: z.string().uuid("Categoria inválida."),
  optionId: z.string().uuid("Opção inválida."),
  detail: z.string().trim().optional(),
});

const mdhoComplementSchema = z
  .string()
  .trim()
  .max(
    MDHO_COMPLEMENT_MAX_LENGTH,
    `Complemento deve ter no máximo ${MDHO_COMPLEMENT_MAX_LENGTH} caracteres.`,
  )
  .optional();

export const saveMdhoDraftSchema = z.object({
  assessmentId: z.string().uuid("Avaliação MDHO é obrigatória."),
  selections: z.array(mdhoSelectionInputSchema).optional(),
  complement: mdhoComplementSchema,
  expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
});

export const submitMdhoSchema = z.object({
  assessmentId: z.string().uuid("Avaliação MDHO é obrigatória."),
  selections: z.array(mdhoSelectionInputSchema),
  complement: mdhoComplementSchema,
});

export const returnMdhoSchema = z.object({
  assessmentId: z.string().uuid("Avaliação MDHO é obrigatória."),
  returnReason: z
    .string()
    .trim()
    .min(
      MDHO_RETURN_REASON_MIN_LENGTH,
      `Motivo deve ter no mínimo ${MDHO_RETURN_REASON_MIN_LENGTH} caracteres.`,
    )
    .max(
      MDHO_RETURN_REASON_MAX_LENGTH,
      `Motivo deve ter no máximo ${MDHO_RETURN_REASON_MAX_LENGTH} caracteres.`,
    ),
});

export type SaveMdhoDraftInput = z.infer<typeof saveMdhoDraftSchema>;
export type SubmitMdhoInput = z.infer<typeof submitMdhoSchema>;
export type ReturnMdhoInput = z.infer<typeof returnMdhoSchema>;

type RefinementCtx = z.RefinementCtx;

function findOption(catalog: MdhoCatalogCategory[], categoryId: string, optionId: string) {
  const category = catalog.find((item) => item.id === categoryId);
  if (!category) {
    return null;
  }

  const option = category.options.find((item) => item.id === optionId);
  if (!option) {
    return null;
  }

  return { category, option };
}

/**
 * Valida seleções para submit conforme PO-MDHO-14 (espelha RPC server-side).
 */
export function validateMdhoSubmitSelections(
  selections: MdhoSelectionInput[],
  catalog: MdhoCatalogCategory[],
  ctx: RefinementCtx,
): void {
  const countsByCategory = new Map<string, number>();

  for (const [index, selection] of selections.entries()) {
    const resolved = findOption(catalog, selection.categoryId, selection.optionId);

    if (!resolved) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Seleção inválida: opção ou categoria inexistente.",
        path: ["selections", index],
      });
      continue;
    }

    const { category, option } = resolved;
    const currentCount = countsByCategory.get(category.id) ?? 0;
    countsByCategory.set(category.id, currentCount + 1);

    if (!category.allowsMultiple && currentCount >= 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${category.name} não permite múltiplas seleções.`,
        path: ["selections", index, "optionId"],
      });
    }

    if (
      option.code === MDHO_OTHER_OPTION_CODE &&
      option.allowsDetail &&
      (!selection.detail || selection.detail.trim().length < MDHO_OTHER_DETAIL_MIN_LENGTH)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Opção Outro exige detalhamento com no mínimo ${MDHO_OTHER_DETAIL_MIN_LENGTH} caracteres.`,
        path: ["selections", index, "detail"],
      });
    }
  }

  for (const category of catalog) {
    const count = countsByCategory.get(category.id) ?? 0;

    if (category.requiresSelection && count < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Selecione ao menos uma opção em ${category.name}.`,
        path: ["selections"],
      });
    }

    if (category.code === MDHO_DEVIATION_TYPE_CATEGORY_CODE && count !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Tipo de Desvio exige exatamente uma opção selecionada.",
        path: ["selections"],
      });
    }
  }
}

/** Schema de submit com validação PO-MDHO-14 usando catálogo carregado. */
export function createSubmitMdhoSchema(catalog: MdhoCatalogCategory[]) {
  return submitMdhoSchema.superRefine((data, ctx) => {
    validateMdhoSubmitSelections(data.selections, catalog, ctx);
  });
}

export {
  MDHO_COMPLEMENT_MAX_LENGTH,
  MDHO_OTHER_DETAIL_MIN_LENGTH,
  MDHO_RETURN_REASON_MAX_LENGTH,
  MDHO_RETURN_REASON_MIN_LENGTH,
};

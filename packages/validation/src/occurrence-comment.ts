import { OCCURRENCE_COMMENT_MAX_LENGTH } from "@safestop/types";
import { z } from "zod";

const commentContentSchema = z
  .string()
  .trim()
  .min(1, "Comentário é obrigatório.")
  .max(
    OCCURRENCE_COMMENT_MAX_LENGTH,
    `Comentário deve ter no máximo ${OCCURRENCE_COMMENT_MAX_LENGTH} caracteres.`,
  );

export const createOccurrenceCommentSchema = z.object({
  occurrenceId: z.string().uuid("Ocorrência é obrigatória."),
  content: commentContentSchema,
});

export const updateOccurrenceCommentSchema = z.object({
  commentId: z.string().uuid("Comentário é obrigatório."),
  content: commentContentSchema,
});

export type CreateOccurrenceCommentInput = z.infer<typeof createOccurrenceCommentSchema>;
export type UpdateOccurrenceCommentInput = z.infer<typeof updateOccurrenceCommentSchema>;

export { OCCURRENCE_COMMENT_MAX_LENGTH };

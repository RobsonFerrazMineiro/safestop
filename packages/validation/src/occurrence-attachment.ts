import {
  OCCURRENCE_ATTACHMENT_CAPTION_MAX_LENGTH,
  OCCURRENCE_ATTACHMENT_MAX_COUNT_PER_OCCURRENCE,
  OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  OCCURRENCE_ATTACHMENT_MIME_TYPES,
  OCCURRENCE_ATTACHMENT_TYPES,
} from "@safestop/types";
import { z } from "zod";

const attachmentTypeSchema = z.enum(OCCURRENCE_ATTACHMENT_TYPES, {
  errorMap: () => ({ message: "Tipo de evidência inválido." }),
});

const attachmentMimeTypeSchema = z.enum(OCCURRENCE_ATTACHMENT_MIME_TYPES, {
  errorMap: () => ({ message: "Formato de imagem não suportado." }),
});

const latitudeSchema = z
  .number()
  .finite()
  .min(-90, "Latitude inválida.")
  .max(90, "Latitude inválida.")
  .optional();

const longitudeSchema = z
  .number()
  .finite()
  .min(-180, "Longitude inválida.")
  .max(180, "Longitude inválida.")
  .optional();

/**
 * Payload client-side para prepare_occurrence_attachment_upload (camelCase).
 */
export const prepareAttachmentUploadSchema = z.object({
  occurrenceId: z.string().uuid("Ocorrência é obrigatória."),
  attachmentType: attachmentTypeSchema,
  originalFileName: z
    .string()
    .trim()
    .min(1, "Nome do arquivo é obrigatório.")
    .max(255, "Nome do arquivo deve ter no máximo 255 caracteres."),
  mimeType: attachmentMimeTypeSchema,
  fileSize: z
    .number()
    .int("Tamanho do arquivo inválido.")
    .positive("Tamanho do arquivo inválido.")
    .max(
      OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
      `Arquivo deve ter no máximo ${OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES / (1024 * 1024)} MiB.`,
    ),
  caption: z
    .string()
    .trim()
    .max(
      OCCURRENCE_ATTACHMENT_CAPTION_MAX_LENGTH,
      `Legenda deve ter no máximo ${OCCURRENCE_ATTACHMENT_CAPTION_MAX_LENGTH} caracteres.`,
    )
    .optional()
    .transform((value) => (value === "" ? undefined : value)),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  capturedAt: z.string().datetime({ message: "Data/hora inválida." }).optional(),
});

export type PrepareAttachmentUploadInput = z.infer<typeof prepareAttachmentUploadSchema>;

export {
  OCCURRENCE_ATTACHMENT_CAPTION_MAX_LENGTH,
  OCCURRENCE_ATTACHMENT_MAX_COUNT_PER_OCCURRENCE,
  OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  OCCURRENCE_ATTACHMENT_MIME_TYPES,
  OCCURRENCE_ATTACHMENT_TYPES,
};

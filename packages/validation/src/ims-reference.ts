import {
  IMS_REFERENCE_CODE_PATTERN,
  IMS_UPDATE_REASON_MAX_LENGTH,
  IMS_UPDATE_REASON_MIN_LENGTH,
} from "@safestop/types";
import { z } from "zod";

const imsReferenceCodeSchema = z
  .string()
  .trim()
  .regex(IMS_REFERENCE_CODE_PATTERN, "Use o formato BAA-XX-0000 (ex.: BAA-26-0001).");

const imsUpdateReasonSchema = z
  .string()
  .trim()
  .min(
    IMS_UPDATE_REASON_MIN_LENGTH,
    `Motivo deve ter no mínimo ${IMS_UPDATE_REASON_MIN_LENGTH} caracteres.`,
  )
  .max(
    IMS_UPDATE_REASON_MAX_LENGTH,
    `Motivo deve ter no máximo ${IMS_UPDATE_REASON_MAX_LENGTH} caracteres.`,
  );

export const registerImsReferenceSchema = z.object({
  occurrenceId: z.string().uuid("Ocorrência é obrigatória."),
  imsReferenceCode: imsReferenceCodeSchema,
});

export const updateImsReferenceSchema = z.object({
  occurrenceId: z.string().uuid("Ocorrência é obrigatória."),
  imsReferenceCode: imsReferenceCodeSchema,
  updateReason: imsUpdateReasonSchema,
});

export type RegisterImsReferenceInput = z.infer<typeof registerImsReferenceSchema>;
export type UpdateImsReferenceInput = z.infer<typeof updateImsReferenceSchema>;

export { IMS_REFERENCE_CODE_PATTERN, IMS_UPDATE_REASON_MAX_LENGTH, IMS_UPDATE_REASON_MIN_LENGTH };

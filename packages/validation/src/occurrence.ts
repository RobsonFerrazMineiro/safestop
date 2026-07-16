import { OCCURRENCE_SEVERITIES } from "@safestop/types";
import { z } from "zod";

const optionalUuidSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value === "" ? undefined : value))
  .refine((value) => value === undefined || z.string().uuid().safeParse(value).success, {
    message: "Identificador inválido.",
  });

const requiredTextSchema = (label: string, max = 2000) =>
  z
    .string()
    .trim()
    .min(1, `${label} é obrigatório.`)
    .max(max, `${label} deve ter no máximo ${max} caracteres.`);

const optionalTextSchema = (max = 2000) =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => (value === "" ? undefined : value))
    .refine((value) => value === undefined || value.length <= max, {
      message: `Texto deve ter no máximo ${max} caracteres.`,
    });

const severitySchema = z.enum(OCCURRENCE_SEVERITIES, {
  errorMap: () => ({ message: "Criticidade inválida." }),
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

const locationAccuracySchema = z.number().finite().nonnegative().optional();

/**
 * Payload de criação enviado ao RPC create_occurrence (camelCase).
 * organization_id e created_by são definidos no servidor.
 */
export const createOccurrenceSchema = z.object({
  title: requiredTextSchema("Título", 200),
  taskDescription: requiredTextSchema("Atividade"),
  locationDescription: requiredTextSchema("Local"),
  conditionDescription: requiredTextSchema("Condição insegura"),
  immediateActionDescription: optionalTextSchema(),
  severity: severitySchema,
  areaId: z.string().uuid("Área é obrigatória."),
  unitId: optionalUuidSchema,
  contractId: optionalUuidSchema,
  contractorOrganizationId: optionalUuidSchema,
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  locationAccuracy: locationAccuracySchema,
  occurredAt: z.string().datetime({ message: "Data/hora inválida." }).optional(),
});

/**
 * Rascunho local — campos parciais permitidos (mobile, sem persistência no servidor).
 */
export const occurrenceDraftSchema = createOccurrenceSchema.partial();

export type CreateOccurrenceInput = z.infer<typeof createOccurrenceSchema>;
export type OccurrenceDraftInput = z.infer<typeof occurrenceDraftSchema>;

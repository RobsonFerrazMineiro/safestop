import {
  ORGANIZATION_CONTACT_TYPE_MANAGING_COMPANY_SUPERVISOR,
  ORGANIZATION_CONTACT_TYPES,
  type OrganizationContactTypeExtended,
} from "@safestop/types";
import { z } from "zod";

const organizationContactTypeSchema = z.enum(
  [...ORGANIZATION_CONTACT_TYPES, ORGANIZATION_CONTACT_TYPE_MANAGING_COMPANY_SUPERVISOR] as [
    OrganizationContactTypeExtended,
    ...OrganizationContactTypeExtended[],
  ],
  { errorMap: () => ({ message: "Tipo de contato inválido." }) },
);

const optionalUuidSchema = z.string().uuid("Identificador inválido.").nullable().optional();

const prioritySchema = z
  .number()
  .int("Prioridade deve ser um número inteiro.")
  .positive("Prioridade deve ser maior que zero.")
  .optional();

export const createOrganizationContactSchema = z.object({
  organizationMemberId: z.string().uuid("Membro é obrigatório."),
  contactType: organizationContactTypeSchema,
  priority: prioritySchema,
  unitId: optionalUuidSchema,
  areaId: optionalUuidSchema,
  managementDepartmentId: optionalUuidSchema,
  contractId: optionalUuidSchema,
});

export const updateOrganizationContactSchema = z.object({
  id: z.string().uuid("Contato é obrigatório."),
  organizationMemberId: z.string().uuid("Membro inválido.").optional(),
  contactType: organizationContactTypeSchema.optional(),
  priority: prioritySchema,
  unitId: optionalUuidSchema,
  areaId: optionalUuidSchema,
  managementDepartmentId: optionalUuidSchema,
  contractId: optionalUuidSchema,
  isActive: z.boolean().optional(),
});

export type CreateOrganizationContactInput = z.infer<typeof createOrganizationContactSchema>;
export type UpdateOrganizationContactInput = z.infer<typeof updateOrganizationContactSchema>;

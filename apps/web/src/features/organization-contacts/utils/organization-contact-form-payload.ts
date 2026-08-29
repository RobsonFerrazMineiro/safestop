import type {
  CreateOrganizationContactInput,
  OrganizationContactTypeExtended,
} from "@safestop/types";

export type OrganizationContactFormValues = {
  organizationMemberId: string;
  contactType: OrganizationContactTypeExtended;
  priority: string;
  unitId: string;
  areaId: string;
  contractId: string;
};

export type OrganizationContactFormResult =
  { error: string } | { payload: CreateOrganizationContactInput };

export function buildOrganizationContactFormPayload(
  values: OrganizationContactFormValues,
  contractRequired: boolean,
): OrganizationContactFormResult {
  if (!values.organizationMemberId) {
    return { error: "Selecione o membro responsável." };
  }

  if (contractRequired && !values.contractId) {
    return { error: "Contrato é obrigatório para este tipo de contato." };
  }

  const parsedPriority = Number(values.priority);

  if (!Number.isFinite(parsedPriority) || parsedPriority <= 0) {
    return { error: "Prioridade deve ser um número positivo." };
  }

  return {
    payload: {
      organizationMemberId: values.organizationMemberId,
      contactType: values.contactType,
      priority: parsedPriority,
      unitId: values.unitId || null,
      areaId: values.areaId || null,
      contractId: values.contractId || null,
    },
  };
}

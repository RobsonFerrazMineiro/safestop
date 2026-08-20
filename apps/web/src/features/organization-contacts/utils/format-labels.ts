import {
  ORGANIZATION_CONTACT_TYPE_LABELS,
  ORGANIZATION_CONTACT_TYPE_MANAGING_COMPANY_SUPERVISOR,
  type OrganizationContactTypeExtended,
} from "@safestop/types";

const MANAGING_LABEL = "Supervisão da Gerenciadora";

export function formatOrganizationContactType(type: OrganizationContactTypeExtended): string {
  if (type === ORGANIZATION_CONTACT_TYPE_MANAGING_COMPANY_SUPERVISOR) {
    return MANAGING_LABEL;
  }

  return ORGANIZATION_CONTACT_TYPE_LABELS[type];
}

export function formatContactScope(contact: {
  unitName: string | null;
  areaName: string | null;
  contractName: string | null;
}): string {
  const parts = [contact.unitName, contact.areaName, contact.contractName].filter(Boolean);

  if (parts.length === 0) {
    return "Org";
  }

  return parts.join(" · ");
}

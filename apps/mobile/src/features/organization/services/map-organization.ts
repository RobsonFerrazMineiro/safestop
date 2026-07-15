import type { UserOrganization } from "../types";

type OrganizationRow = {
  id: string;
  name: string;
  document_number: string | null;
  organization_type: string;
  is_active: boolean;
};

export type OrganizationMemberRow = {
  id: string;
  organization_id: string;
  membership_type: string;
  organizations: OrganizationRow | OrganizationRow[] | null;
};

export function mapOrganizationMemberRow(row: OrganizationMemberRow): UserOrganization | null {
  const organization = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;

  if (!organization || !organization.is_active) {
    return null;
  }

  return {
    id: organization.id,
    name: organization.name,
    code: organization.document_number,
    logoUrl: null,
    organizationType: organization.organization_type,
    organizationMemberId: row.id,
    membershipType: row.membership_type,
  };
}

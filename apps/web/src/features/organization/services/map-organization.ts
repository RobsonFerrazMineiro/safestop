import type { UserOrganization } from "../types";

type OrganizationRecord = {
  id: string;
  name: string;
  document_number: string | null;
  organization_type: string;
  is_active: boolean;
};

type OrganizationMemberJoinRow = {
  id: string;
  organization_id: string;
  membership_type: string;
  organizations: OrganizationRecord | OrganizationRecord[] | null;
};

export function mapOrganizationRow(row: OrganizationMemberJoinRow): UserOrganization | null {
  const organizationData = row.organizations;
  const organization = Array.isArray(organizationData) ? organizationData[0] : organizationData;

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

export function mapOrganizationRows(rows: OrganizationMemberJoinRow[]): UserOrganization[] {
  return rows
    .map(mapOrganizationRow)
    .filter((organization): organization is UserOrganization => organization !== null);
}

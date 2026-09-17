import { createClient } from "@/lib/auth/client";

import { isContractAssignmentRole, type ContractAssignment } from "../types";

type ProfileJoin = { full_name: string | null };
type OrganizationJoin = { name: string };
type MemberJoin = {
  id: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
};

type AssignmentRow = {
  id: string;
  contract_id: string;
  organization_id: string;
  organization_member_id: string;
  assignment_role: string;
  is_active: boolean;
  granted_at: string;
  revoked_at: string | null;
  organizations: OrganizationJoin | OrganizationJoin[] | null;
  organization_members: MemberJoin | MemberJoin[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export function mapContractAssignmentRow(row: AssignmentRow): ContractAssignment | null {
  if (!isContractAssignmentRole(row.assignment_role)) {
    return null;
  }

  const organization = normalizeJoin(row.organizations);
  const member = normalizeJoin(row.organization_members);
  const profile = member ? normalizeJoin(member.profiles) : null;

  return {
    id: row.id,
    contractId: row.contract_id,
    organizationId: row.organization_id,
    organizationName: organization?.name ?? null,
    organizationMemberId: row.organization_member_id,
    memberName: profile?.full_name ?? null,
    assignmentRole: row.assignment_role,
    isActive: row.is_active,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at,
  };
}

export async function listContractAssignments(contractId: string): Promise<ContractAssignment[]> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("contract_assignments")
    .select(
      `
        id,
        contract_id,
        organization_id,
        organization_member_id,
        assignment_role,
        is_active,
        granted_at,
        revoked_at,
        organizations ( name ),
        organization_members (
          id,
          profiles ( full_name )
        )
      `,
    )
    .eq("contract_id", contractId)
    .order("is_active", { ascending: false })
    .order("granted_at", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar os responsáveis do contrato.");
  }

  return ((data ?? []) as AssignmentRow[])
    .map(mapContractAssignmentRow)
    .filter((assignment): assignment is ContractAssignment => assignment !== null);
}

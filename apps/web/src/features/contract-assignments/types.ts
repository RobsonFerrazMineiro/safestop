import { TENANT_QUERY_KEY_PREFIX } from "@safestop/query-keys";

export const CONTRACT_ASSIGNMENT_ROLES = ["FISCAL", "GERENTE", "GESTOR"] as const;

export type ContractAssignmentRole = (typeof CONTRACT_ASSIGNMENT_ROLES)[number];

export type ContractAssignment = {
  id: string;
  contractId: string;
  organizationId: string;
  organizationName: string | null;
  organizationMemberId: string;
  memberName: string | null;
  assignmentRole: ContractAssignmentRole;
  isActive: boolean;
  grantedAt: string;
  revokedAt: string | null;
};

export type AssignableMemberOption = {
  organizationMemberId: string;
  fullName: string | null;
};

export function contractAssignmentQueryKeys(organizationId: string, workspaceId: string) {
  const all = [
    TENANT_QUERY_KEY_PREFIX,
    organizationId,
    workspaceId,
    "contract-assignments",
  ] as const;

  return {
    all,
    contracts: [...all, "contracts"] as const,
    assignments: (contractId: string) => [...all, "list", contractId] as const,
    assignableMembers: [...all, "assignable-members"] as const,
  };
}

export function isContractAssignmentRole(value: string): value is ContractAssignmentRole {
  return (CONTRACT_ASSIGNMENT_ROLES as readonly string[]).includes(value);
}

import type { ContractAssignment } from "../types";

/**
 * Indicação de UX apenas. A autoridade real é RLS
 * (`can_manage_contract_assignment`).
 * Não usa o papel da EMPRESA no Ambiente para decidir edição.
 */
export function canEditContractAssignment(input: {
  assignmentOrganizationId: string;
  actingOrganizationId: string;
}): boolean {
  return input.assignmentOrganizationId === input.actingOrganizationId;
}

export function formatContractAssignmentRole(role: ContractAssignment["assignmentRole"]): string {
  if (role === "FISCAL") {
    return "Fiscal";
  }

  if (role === "GERENTE") {
    return "Gerente";
  }

  return "Gestor";
}

export function getPostgrestForbiddenMessage(
  error: { code?: string; message?: string } | null,
): string | null {
  const code = error?.code ?? "";
  const message = error?.message ?? "";

  if (
    code === "42501" ||
    code === "PGRST301" ||
    code === "403" ||
    message.toUpperCase().includes("FORBIDDEN") ||
    message.includes("permission denied")
  ) {
    return "Você não possui permissão para esta operação.";
  }

  return null;
}

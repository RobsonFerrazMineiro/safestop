import { createClient } from "@/lib/auth/client";

import type { ContractAssignmentRole } from "../types";
import { getPostgrestForbiddenMessage } from "../utils/assignment-rules";

export async function createContractAssignment(input: {
  organizationId: string;
  organizationMemberId: string;
  contractId: string;
  assignmentRole: ContractAssignmentRole;
}): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { error } = await supabase.from("contract_assignments").insert({
    organization_id: input.organizationId,
    organization_member_id: input.organizationMemberId,
    contract_id: input.contractId,
    assignment_role: input.assignmentRole,
    is_active: true,
  });

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "Este responsável já está atribuído a este contrato com esta responsabilidade.",
      );
    }

    throw new Error(
      getPostgrestForbiddenMessage(error) ??
        "Não foi possível adicionar o responsável ao contrato.",
    );
  }
}

export async function revokeContractAssignment(assignmentId: string): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { error } = await supabase
    .from("contract_assignments")
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);

  if (error) {
    throw new Error(
      getPostgrestForbiddenMessage(error) ?? "Não foi possível revogar o responsável do contrato.",
    );
  }
}

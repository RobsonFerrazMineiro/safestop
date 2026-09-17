import { createClient } from "@/lib/auth/client";

import type { AssignableMemberOption } from "../types";

type ProfileJoin = { full_name: string | null };
type MemberJoin = {
  id: string;
  is_active: boolean;
  organization_id: string;
  profiles: ProfileJoin | ProfileJoin[] | null;
};

type MembershipRow = {
  organization_member_id: string;
  organization_members: MemberJoin | MemberJoin[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

/**
 * Gate 13X.5.5 — filtro do picker: EMPRESA atuante + Ambiente ativo.
 * Fonte: workspace_memberships (RLS 13X.5.4). Sem wildcard cross-org.
 * Sem filtro por titular do contrato, papel da EMPRESA no Ambiente ou owner.
 */
export function buildAssignableMembersQuery(input: {
  organizationId: string;
  workspaceId: string;
}): {
  organizationId: string;
  workspaceId: string;
  isActive: true;
} {
  return {
    organizationId: input.organizationId,
    workspaceId: input.workspaceId,
    isActive: true,
  };
}

/**
 * Colegas da EMPRESA atuante com membership ativo no Ambiente.
 * RLS 13X.5.4 autoriza SELECT dos grants da própria org no Workspace.
 */
export async function listAssignableMembers(input: {
  organizationId: string;
  workspaceId: string;
}): Promise<AssignableMemberOption[]> {
  const supabase = createClient();
  const filter = buildAssignableMembersQuery(input);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("workspace_memberships")
    .select(
      `
        organization_member_id,
        organization_members!inner (
          id,
          is_active,
          organization_id,
          profiles ( full_name )
        )
      `,
    )
    .eq("workspace_id", filter.workspaceId)
    .eq("organization_id", filter.organizationId)
    .eq("is_active", filter.isActive)
    .eq("organization_members.is_active", true)
    .eq("organization_members.organization_id", filter.organizationId);

  if (error) {
    throw new Error("Não foi possível carregar os membros atribuíveis.");
  }

  const options: AssignableMemberOption[] = [];
  const seen = new Set<string>();

  for (const row of (data ?? []) as MembershipRow[]) {
    const member = normalizeJoin(row.organization_members);

    if (!member || !member.is_active || member.organization_id !== input.organizationId) {
      continue;
    }

    if (seen.has(member.id)) {
      continue;
    }

    seen.add(member.id);
    const profile = normalizeJoin(member.profiles);
    options.push({
      organizationMemberId: member.id,
      fullName: profile?.full_name ?? null,
    });
  }

  return options.sort((left, right) =>
    (left.fullName ?? "").localeCompare(right.fullName ?? "", "pt-BR"),
  );
}

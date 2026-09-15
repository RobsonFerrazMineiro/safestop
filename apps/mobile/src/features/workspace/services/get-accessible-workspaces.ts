import { getSupabaseClient } from "@/lib/auth/client";

import type { AccessibleWorkspace } from "../types";

type WorkspaceJoin = {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  owner_organization_id: string | null;
};

type OrganizationWorkspaceLinkRow = {
  workspace_id: string;
  workspaces: WorkspaceJoin | WorkspaceJoin[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapAccessibleWorkspace(row: OrganizationWorkspaceLinkRow): AccessibleWorkspace | null {
  const workspace = normalizeJoin(row.workspaces);

  if (!workspace || !workspace.is_active) {
    return null;
  }

  return {
    id: workspace.id,
    name: workspace.name,
    code: workspace.code,
    isActive: workspace.is_active,
    ownerOrganizationId: workspace.owner_organization_id,
  };
}

/**
 * Workspaces acessíveis na Organization ativa via SELECT autenticado + RLS.
 * Filtra pelo `organization_id` ativo — platform admin não recebe set universal na UI.
 */
export async function getAccessibleWorkspaces(
  organizationId: string,
): Promise<AccessibleWorkspace[]> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("organization_workspace_links")
    .select(
      `
        workspace_id,
        workspaces!inner (
          id,
          name,
          code,
          is_active,
          owner_organization_id
        )
      `,
    )
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .eq("workspaces.is_active", true)
    .order("workspace_id", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os Workspaces acessíveis.");
  }

  const workspaces: AccessibleWorkspace[] = [];
  const seen = new Set<string>();

  for (const row of (data ?? []) as OrganizationWorkspaceLinkRow[]) {
    const mapped = mapAccessibleWorkspace(row);

    if (!mapped || seen.has(mapped.id)) {
      continue;
    }

    seen.add(mapped.id);
    workspaces.push(mapped);
  }

  return workspaces.sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

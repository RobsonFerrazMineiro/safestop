import { getSupabaseClient } from "@/lib/auth/client";

import type { OccurrenceAreaOption } from "../types";
import { buildWorkspaceAreasOrFilter } from "../utils/workspace-create-rules";

type AreaRow = {
  id: string;
  name: string;
  code: string | null;
};

/**
 * Áreas do Ambiente ativo — dual-read (Gate 13X.4 / ADR-006).
 * Não filtra apenas pela EMPRESA atuante.
 */
export async function getWorkspaceAreas(
  workspaceId: string,
  ownerOrganizationId: string | null,
): Promise<OccurrenceAreaOption[]> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("areas")
    .select("id, name, code")
    .or(buildWorkspaceAreasOrFilter({ workspaceId, ownerOrganizationId }))
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar as áreas do Ambiente.");
  }

  return ((data ?? []) as AreaRow[]).map((area) => ({
    id: area.id,
    name: area.name,
    code: area.code,
  }));
}

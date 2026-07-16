import { createClient } from "@/lib/auth/client";

import type { OrganizationAreaOption } from "../types";

type AreaRow = {
  id: string;
  name: string;
  code: string | null;
};

export async function getOrganizationAreas(
  organizationId: string,
): Promise<OrganizationAreaOption[]> {
  const supabase = createClient();

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
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar as áreas.");
  }

  return ((data ?? []) as AreaRow[]).map((area) => ({
    id: area.id,
    name: area.name,
    code: area.code,
  }));
}

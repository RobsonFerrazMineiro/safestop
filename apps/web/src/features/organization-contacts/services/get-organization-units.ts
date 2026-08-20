import { createClient } from "@/lib/auth/client";

import type { OrganizationUnitOption } from "../types";

export async function getOrganizationUnits(
  organizationId: string,
): Promise<OrganizationUnitOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("units")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error("Não foi possível carregar as unidades.");
  }

  return (data ?? []) as OrganizationUnitOption[];
}

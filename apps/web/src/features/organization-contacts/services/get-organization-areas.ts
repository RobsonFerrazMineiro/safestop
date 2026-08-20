import { createClient } from "@/lib/auth/client";

import type { OrganizationAreaOption } from "../types";

type AreaRow = {
  id: string;
  name: string;
  unit_id: string | null;
};

export async function getOrganizationAreasForContacts(
  organizationId: string,
): Promise<OrganizationAreaOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("areas")
    .select("id, name, unit_id")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    throw new Error("Não foi possível carregar as áreas.");
  }

  return ((data ?? []) as AreaRow[]).map((area) => ({
    id: area.id,
    name: area.name,
    unitId: area.unit_id,
  }));
}

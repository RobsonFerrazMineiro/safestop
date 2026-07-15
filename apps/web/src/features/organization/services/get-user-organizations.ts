import { createClient } from "@/lib/auth/client";

import { mapOrganizationRows } from "./map-organization";
import type { UserOrganization } from "../types";

export async function getUserOrganizations(): Promise<UserOrganization[]> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select(
      `
        id,
        organization_id,
        membership_type,
        organizations (
          id,
          name,
          document_number,
          organization_type,
          is_active
        )
      `,
    )
    .eq("profile_id", user.id)
    .eq("is_active", true);

  if (error) {
    throw new Error("Não foi possível carregar suas organizações.");
  }

  return mapOrganizationRows((data ?? []) as Parameters<typeof mapOrganizationRows>[0]);
}

import { getSupabaseClient } from "@/lib/auth/client";

import { mapOrganizationMemberRow, type OrganizationMemberRow } from "./map-organization";
import type { UserOrganization } from "../types";

const ORGANIZATION_MEMBERS_SELECT = `
  id,
  organization_id,
  organizations (
    id,
    name,
    document_number,
    organization_type,
    is_active
  )
`;

export async function getUserOrganizations(): Promise<UserOrganization[]> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select(ORGANIZATION_MEMBERS_SELECT)
    .eq("profile_id", user.id)
    .eq("is_active", true);

  if (error) {
    throw new Error("Não foi possível carregar as organizações.");
  }

  return (data as OrganizationMemberRow[])
    .map(mapOrganizationMemberRow)
    .filter((organization): organization is UserOrganization => organization !== null);
}

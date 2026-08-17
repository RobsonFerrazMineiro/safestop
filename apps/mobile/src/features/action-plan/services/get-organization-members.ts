import { getSupabaseClient } from "@/lib/auth/client";

import type { OrganizationMemberOption } from "../types";

type MemberRow = {
  id: string;
  profile_id: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

export async function getOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMemberOption[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select("id, profile_id, profiles:profile_id(full_name)")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os membros da organização.");
  }

  return (data as MemberRow[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

    return {
      id: row.id,
      profileId: row.profile_id,
      fullName: profile?.full_name ?? null,
    };
  });
}

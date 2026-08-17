import { createClient } from "@/lib/auth/client";

import type { OrganizationMemberOption } from "../types";

type MemberRow = {
  id: string;
  profile_id: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
}

export async function getOrganizationMembers(
  organizationId: string,
): Promise<OrganizationMemberOption[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("organization_members")
    .select("id, profile_id, profiles ( full_name )")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("id");

  if (error) {
    throw new Error("Não foi possível carregar os membros da organização.");
  }

  return (data ?? []).map((row) => {
    const member = row as MemberRow;
    const profile = normalizeJoin(member.profiles);

    return {
      id: member.id,
      profileId: member.profile_id,
      fullName: profile?.full_name ?? null,
    };
  });
}

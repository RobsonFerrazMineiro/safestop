import { getSupabaseClient } from "@/lib/auth/client";

export async function hasOrganizationContactScope(
  organizationId: string,
  organizationMemberId: string,
): Promise<boolean> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from("organization_contacts")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("organization_member_id", organizationMemberId)
    .eq("is_active", true);

  if (error) {
    throw new Error("Não foi possível verificar escopo operacional.");
  }

  return (count ?? 0) > 0;
}

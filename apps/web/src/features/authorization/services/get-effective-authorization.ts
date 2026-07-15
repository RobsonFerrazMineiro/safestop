import { createClient } from "@/lib/auth/client";

import { mapAuthorizationRows } from "./map-authorization";
import type { AuthorizationSnapshot } from "./types";

type GetEffectiveAuthorizationParams = {
  organizationMemberId: string;
  membershipType: string;
};

type MemberRoleRow = Parameters<typeof mapAuthorizationRows>[0][number];

export async function getEffectiveAuthorization(
  params: GetEffectiveAuthorizationParams,
): Promise<AuthorizationSnapshot> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("member_roles")
    .select(
      `
        roles (
          id,
          name,
          organization_id,
          is_active,
          role_permissions (
            permissions (
              code
            )
          )
        )
      `,
    )
    .eq("organization_member_id", params.organizationMemberId);

  if (error) {
    throw new Error("Não foi possível carregar suas permissões.");
  }

  return mapAuthorizationRows((data ?? []) as MemberRoleRow[], params.membershipType);
}

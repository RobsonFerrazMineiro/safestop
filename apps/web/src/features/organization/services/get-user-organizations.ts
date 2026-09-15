import { createClient } from "@/lib/auth/client";

import { mapOrganizationRows } from "./map-organization";
import type { UserOrganization } from "../types";

export async function getUserOrganizations(providedUserId?: string): Promise<UserOrganization[]> {
  const supabase = createClient();
  let userId = providedUserId;

  if (!userId) {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Não autenticado.");
      }

      userId = user.id;
    } catch (err) {
      if (err instanceof Error && err.message === "Não autenticado.") {
        throw err;
      }
      throw new Error(
        "Não foi possível verificar a autenticação com o servidor. Verifique a conexão com o backend.",
      );
    }
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
    .eq("profile_id", userId)
    .eq("is_active", true);

  if (error) {
    throw new Error("Não foi possível carregar suas organizações.");
  }

  return mapOrganizationRows((data ?? []) as Parameters<typeof mapOrganizationRows>[0]);
}

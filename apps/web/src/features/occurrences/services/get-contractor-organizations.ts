import { createClient } from "@/lib/auth/client";

import type { ContractorOrganizationOption } from "../types";

type ContractRow = {
  contractor_organization_id: string;
  organizations: { id: string; name: string } | { id: string; name: string }[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function getContractorOrganizations(
  organizationId: string,
): Promise<ContractorOrganizationOption[]> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("contracts")
    .select(
      `
        contractor_organization_id,
        organizations!contracts_contractor_organization_id_fkey (
          id,
          name
        )
      `,
    )
    .eq("client_organization_id", organizationId)
    .eq("is_active", true)
    .order("contractor_organization_id");

  if (error) {
    throw new Error("Não foi possível carregar as empresas envolvidas.");
  }

  const options = new Map<string, ContractorOrganizationOption>();

  for (const row of (data ?? []) as ContractRow[]) {
    const organization = normalizeJoin(row.organizations);

    if (!organization) {
      continue;
    }

    options.set(organization.id, {
      id: organization.id,
      name: organization.name,
    });
  }

  return [...options.values()].sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

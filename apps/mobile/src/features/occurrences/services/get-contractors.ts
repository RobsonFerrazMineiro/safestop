import { getSupabaseClient } from "@/lib/auth/client";

import type { OccurrenceContractorOption } from "../types";

type ContractRow = {
  contractor_organization_id: string;
  organizations: { id: string; name: string } | { id: string; name: string }[] | null;
};

type GetContractorsParams = {
  organizationId: string;
};

export async function getContractors(
  params: GetContractorsParams,
): Promise<OccurrenceContractorOption[]> {
  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("contracts")
    .select("contractor_organization_id, organizations:contractor_organization_id (id, name)")
    .eq("client_organization_id", params.organizationId)
    .eq("is_active", true)
    .order("contractor_organization_id");

  if (error) {
    throw new Error("Não foi possível carregar as empresas contratadas.");
  }

  const seen = new Set<string>();
  const contractors: OccurrenceContractorOption[] = [];

  for (const row of data as ContractRow[]) {
    if (seen.has(row.contractor_organization_id)) {
      continue;
    }

    const org = Array.isArray(row.organizations) ? row.organizations[0] : row.organizations;

    if (!org?.id || !org.name) {
      continue;
    }

    seen.add(row.contractor_organization_id);
    contractors.push({
      id: org.id,
      name: org.name,
    });
  }

  return contractors.sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@safestop/types";

type Client = SupabaseClient<Database>;

export async function countRows(
  client: Client,
  table: "occurrences" | "action_items" | "action_plans" | "mdho_assessments" | "notifications",
  build: (query: ReturnType<Client["from"]>) => ReturnType<Client["from"]>,
): Promise<number> {
  let query = client.from(table).select("id", { count: "exact", head: true });
  query = build(query);

  const { count, error } = await query;

  if (error) {
    throw new Error("Não foi possível carregar os indicadores do dashboard.");
  }

  return count ?? 0;
}

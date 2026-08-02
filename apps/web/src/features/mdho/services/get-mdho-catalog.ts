import { createClient } from "@/lib/auth/client";

import { mapMdhoCatalogRows, type CategoryRow } from "./map-mdho-result";

const CATALOG_SELECT = `
  id,
  code,
  name,
  description,
  allows_multiple,
  requires_selection,
  display_order,
  is_active,
  mdho_options (
    id,
    category_id,
    code,
    label,
    allows_detail,
    display_order,
    is_active
  )
`;

export async function getMdhoCatalog(organizationId: string) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("mdho_categories")
    .select(CATALOG_SELECT)
    .eq("is_active", true)
    .or(`organization_id.is.null,organization_id.eq.${organizationId}`)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar o catálogo MDHO.");
  }

  return mapMdhoCatalogRows((data ?? []) as CategoryRow[]);
}

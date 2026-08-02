import { getSupabaseClient } from "@/lib/auth/client";

import {
  mapMdhoAssessmentRow,
  mapMdhoCatalogRows,
  type MdhoAssessmentEnriched,
  type RpcAssessmentRow,
  type RpcCategoryRow,
} from "./map-mdho";

const MDHO_ASSESSMENT_SELECT = `
  id,
  occurrence_id,
  organization_id,
  status,
  complement,
  submitted_at,
  submitted_by,
  approved_at,
  approved_by,
  returned_at,
  returned_by,
  return_reason,
  created_at,
  updated_at,
  mdho_selections (
    id,
    category_id,
    option_id,
    detail,
    created_at,
    created_by
  ),
  submitter:profiles!mdho_assessments_submitted_by_fkey (full_name),
  approver:profiles!mdho_assessments_approved_by_fkey (full_name),
  returner:profiles!mdho_assessments_returned_by_fkey (full_name)
`;

const MDHO_CATALOG_SELECT = `
  id,
  code,
  name,
  description,
  allows_multiple,
  requires_selection,
  display_order,
  mdho_options (
    id,
    category_id,
    code,
    label,
    allows_detail,
    display_order
  )
`;

type GetMdhoAssessmentParams = {
  occurrenceId: string;
  organizationId: string;
};

export async function getMdhoAssessment(
  params: GetMdhoAssessmentParams,
): Promise<MdhoAssessmentEnriched | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("mdho_assessments")
    .select(MDHO_ASSESSMENT_SELECT)
    .eq("occurrence_id", params.occurrenceId)
    .eq("organization_id", params.organizationId)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar a avaliação MDHO.");
  }

  if (!data) {
    return null;
  }

  return mapMdhoAssessmentRow(data as RpcAssessmentRow);
}

export async function getMdhoCatalog(): Promise<ReturnType<typeof mapMdhoCatalogRows>> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("mdho_categories")
    .select(MDHO_CATALOG_SELECT)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar o catálogo MDHO.");
  }

  return mapMdhoCatalogRows((data ?? []) as RpcCategoryRow[]);
}

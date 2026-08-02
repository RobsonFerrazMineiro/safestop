import { createClient } from "@/lib/auth/client";

import { mapMdhoAssessmentRow, type AssessmentRow } from "./map-mdho-result";

const ASSESSMENT_SELECT = `
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
  submitted_by_profile:profiles!mdho_assessments_submitted_by_fkey ( full_name ),
  approved_by_profile:profiles!mdho_assessments_approved_by_fkey ( full_name ),
  returned_by_profile:profiles!mdho_assessments_returned_by_fkey ( full_name )
`;

export async function getMdhoAssessment(organizationId: string, occurrenceId: string) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("mdho_assessments")
    .select(ASSESSMENT_SELECT)
    .eq("organization_id", organizationId)
    .eq("occurrence_id", occurrenceId)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível carregar a avaliação MDHO.");
  }

  if (!data) {
    return null;
  }

  return mapMdhoAssessmentRow(data as AssessmentRow);
}

import { createClient } from "@/lib/auth/client";

import type { OccurrenceEvidenceList } from "../types";
import {
  buildOccurrenceEvidenceListQuery,
  mapOccurrenceAttachmentRow,
} from "../utils/map-evidence";

/**
 * Gate 13X.2.9 — lista por occurrence. RLS autoriza.
 * Sem pré-filtro organization_id = EMPRESA atuante (tenant do attachment pode ser Hydro).
 */
export async function getOccurrenceEvidence(occurrenceId: string): Promise<OccurrenceEvidenceList> {
  const supabase = createClient();
  const filter = buildOccurrenceEvidenceListQuery(occurrenceId);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data, error } = await supabase
    .from("occurrence_attachments")
    .select(
      "id, occurrence_id, organization_id, attachment_type, original_file_name, mime_type, file_size, caption, upload_status, created_at, profiles:uploaded_by(full_name)",
    )
    .eq("occurrence_id", filter.occurrenceId)
    .is("deleted_at", filter.deletedAt)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar as evidências.");
  }

  return (data ?? [])
    .map((row) => mapOccurrenceAttachmentRow(row))
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

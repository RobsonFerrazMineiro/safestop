import { createClient } from "@/lib/auth/client";

import type { OccurrenceEvidenceList } from "../types";
import { mapOccurrenceAttachmentRow } from "../utils/map-evidence";

export async function getOccurrenceEvidence(
  organizationId: string,
  occurrenceId: string,
): Promise<OccurrenceEvidenceList> {
  const supabase = createClient();

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
    .eq("organization_id", organizationId)
    .eq("occurrence_id", occurrenceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar as evidências.");
  }

  return (data ?? [])
    .map((row) => mapOccurrenceAttachmentRow(row))
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

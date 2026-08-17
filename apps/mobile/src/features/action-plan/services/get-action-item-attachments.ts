import { getSupabaseClient } from "@/lib/auth/client";

import { mapActionItemAttachmentRow } from "./map-action-plan";
import type { ActionItemAttachmentEnriched } from "../types";

export async function getActionItemAttachments(
  itemId: string,
): Promise<ActionItemAttachmentEnriched[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("action_item_attachments")
    .select(
      "id, action_item_id, organization_id, storage_bucket, storage_path, upload_status, mime_type, file_size, caption, created_at, created_by",
    )
    .eq("action_item_id", itemId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar as evidências da ação.");
  }

  return (data ?? [])
    .map((row) => mapActionItemAttachmentRow(row))
    .filter((item): item is ActionItemAttachmentEnriched => item !== null);
}

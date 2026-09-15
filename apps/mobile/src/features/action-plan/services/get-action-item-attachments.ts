import { getSupabaseClient } from "@/lib/auth/client";

import { ACTION_ITEM_ATTACHMENTS_SELECT } from "./action-item-attachments-select";
import { mapActionItemAttachmentRow } from "./map-action-plan";
import type { ActionItemAttachmentEnriched } from "../types";

export { ACTION_ITEM_ATTACHMENTS_SELECT } from "./action-item-attachments-select";

export async function getActionItemAttachments(
  itemId: string,
): Promise<ActionItemAttachmentEnriched[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("action_item_attachments")
    .select(ACTION_ITEM_ATTACHMENTS_SELECT)
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

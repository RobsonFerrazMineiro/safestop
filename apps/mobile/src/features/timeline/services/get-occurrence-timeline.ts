import type { GetOccurrenceTimelineResult, TimelineCursorPayload } from "@safestop/types";
import { OCCURRENCE_TIMELINE_DEFAULT_PAGE_SIZE } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

import { mapTimelineCursor, mapTimelineItem } from "./map-timeline-item";

type RpcTimelineResponse = {
  success: boolean;
  items: Parameters<typeof mapTimelineItem>[0][];
  nextCursor: TimelineCursorPayload | null;
  error?: { message?: string };
};

export async function getOccurrenceTimeline(params: {
  occurrenceId: string;
  cursor?: TimelineCursorPayload | null;
  limit?: number;
}): Promise<GetOccurrenceTimelineResult> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("get_occurrence_timeline", {
    p_occurrence_id: params.occurrenceId,
    p_limit: params.limit ?? OCCURRENCE_TIMELINE_DEFAULT_PAGE_SIZE,
    p_cursor: params.cursor ?? null,
  });

  if (error) {
    throw new Error("Não foi possível carregar a linha do tempo.");
  }

  const response = data as RpcTimelineResponse;

  if (!response.success) {
    throw new Error(response.error?.message ?? "Não foi possível carregar a linha do tempo.");
  }

  const items = (response.items ?? [])
    .map((item) => mapTimelineItem(item))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    items,
    nextCursor: mapTimelineCursor(response.nextCursor),
  };
}

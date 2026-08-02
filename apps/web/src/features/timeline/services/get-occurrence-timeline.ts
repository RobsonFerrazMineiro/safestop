import {
  OCCURRENCE_TIMELINE_DEFAULT_PAGE_SIZE,
  type GetOccurrenceTimelineResult,
  type TimelineCursorPayload,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import { mapTimelineItem } from "./map-timeline-item";

type RpcTimelineResponse = {
  items: Parameters<typeof mapTimelineItem>[0][];
  nextCursor: TimelineCursorPayload | null;
};

export async function getOccurrenceTimeline(
  occurrenceId: string,
  cursor?: TimelineCursorPayload | null,
  limit: number = OCCURRENCE_TIMELINE_DEFAULT_PAGE_SIZE,
): Promise<GetOccurrenceTimelineResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_occurrence_timeline", {
    p_occurrence_id: occurrenceId,
    p_cursor: cursor ?? undefined,
    p_limit: limit,
  });

  if (error) {
    throw new Error("Não foi possível carregar a linha do tempo.");
  }

  const envelope = data as {
    success?: boolean;
    items?: RpcTimelineResponse["items"];
    nextCursor?: TimelineCursorPayload | null;
  };

  if (envelope.success === false) {
    throw new Error("Não foi possível carregar a linha do tempo.");
  }

  if (envelope.success !== true || !Array.isArray(envelope.items)) {
    throw new Error("Não foi possível carregar a linha do tempo.");
  }

  const items = envelope.items
    .map((row) => mapTimelineItem(row))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    items,
    nextCursor: envelope.nextCursor ?? null,
  };
}

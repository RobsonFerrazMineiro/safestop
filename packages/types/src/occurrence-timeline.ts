import type { Json } from "./database.types";

/**
 * Kinds derivados na RPC get_occurrence_timeline (TIMELINE-DECISIONS PO-9).
 */
export const OCCURRENCE_TIMELINE_EVENT_KINDS = [
  "OCCURRENCE_CREATED",
  "STATUS_CHANGED",
  "COMMENT_ADDED",
  "COMMENT_REMOVED",
  "EVIDENCE_ADDED",
  "EVIDENCE_REMOVED",
  "SYSTEM",
] as const;

export type OccurrenceTimelineEventKind = (typeof OCCURRENCE_TIMELINE_EVENT_KINDS)[number];

/** Paginação cursor — ocorrido em DESC + desempate por id (PO-12). */
export type TimelineCursor = {
  occurredAt: string;
  id: string;
};

/** Cursor serializado na RPC (snake_case PostgREST). */
export type TimelineCursorPayload = {
  occurred_at: string;
  id: string;
};

export type OccurrenceTimelineItem = {
  id: string;
  kind: OccurrenceTimelineEventKind;
  occurredAt: string;
  actorId: string | null;
  actorName: string | null;
  title: string;
  body: string | null;
  metadata: Record<string, Json | undefined>;
};

export type GetOccurrenceTimelineResult = {
  items: OccurrenceTimelineItem[];
  nextCursor: TimelineCursorPayload | null;
};

/** Stale time recomendado — TIMELINE-DECISIONS PO-15. */
export const OCCURRENCE_TIMELINE_STALE_TIME_MS = 30_000;

export const OCCURRENCE_TIMELINE_DEFAULT_PAGE_SIZE = 30;

export function isOccurrenceTimelineEventKind(value: string): value is OccurrenceTimelineEventKind {
  return (OCCURRENCE_TIMELINE_EVENT_KINDS as readonly string[]).includes(value);
}

/**
 * Títulos oficiais da timeline (espelham RPC SQL — documentação app layer).
 */
export const OCCURRENCE_TIMELINE_TITLES = {
  OCCURRENCE_CREATED: "Paralisação Preventiva registrada",
  COMMENT_ADDED: "Comentário adicionado",
  COMMENT_REMOVED: "Comentário removido",
  EVIDENCE_ADDED: "Evidência adicionada",
  EVIDENCE_REMOVED: "Evidência removida",
} as const;

export function formatTimelineTitle(kind: OccurrenceTimelineEventKind, title: string): string {
  if (kind === "STATUS_CHANGED") {
    return title;
  }

  const mapped = OCCURRENCE_TIMELINE_TITLES[kind as keyof typeof OCCURRENCE_TIMELINE_TITLES];
  return mapped ?? title;
}

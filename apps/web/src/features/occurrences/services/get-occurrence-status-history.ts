import { isOccurrenceStatus } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import type { OccurrenceStatusHistoryItem } from "../types";

type HistoryRow = {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_at: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapHistoryRow(row: HistoryRow): OccurrenceStatusHistoryItem | null {
  if (!isOccurrenceStatus(row.to_status)) {
    return null;
  }

  const fromStatus =
    row.from_status && isOccurrenceStatus(row.from_status) ? row.from_status : null;
  const profile = normalizeJoin(row.profiles);

  return {
    id: row.id,
    fromStatus,
    toStatus: row.to_status,
    changedAt: row.changed_at,
    changedByName: profile?.full_name ?? null,
  };
}

/**
 * Histórico por occurrence_id. Gate 13X.3: sem pré-filtro organization_id = EMPRESA atuante.
 * `organizationId` permanece na assinatura por compatibilidade da query key.
 */
export async function getOccurrenceStatusHistory(
  _organizationId: string,
  occurrenceId: string,
): Promise<OccurrenceStatusHistoryItem[]> {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Não autenticado.");
  }

  const { data: occurrence, error: occurrenceError } = await supabase
    .from("occurrences")
    .select("id")
    .eq("id", occurrenceId)
    .maybeSingle();

  if (occurrenceError) {
    throw new Error("Não foi possível carregar o histórico.");
  }

  if (!occurrence) {
    return [];
  }

  const { data, error } = await supabase
    .from("occurrence_status_history")
    .select(
      `
        id,
        from_status,
        to_status,
        changed_at,
        profiles!occurrence_status_history_changed_by_fkey ( full_name )
      `,
    )
    .eq("occurrence_id", occurrenceId)
    .order("changed_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar o histórico.");
  }

  return ((data ?? []) as HistoryRow[])
    .map(mapHistoryRow)
    .filter((entry): entry is OccurrenceStatusHistoryItem => entry !== null);
}

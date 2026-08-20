import type { DashboardAccessContext, DashboardRecentOccurrenceItem } from "@safestop/types";
import { canAccessOccurrenceMetrics, DASHBOARD_RECENT_OCCURRENCES_LIMIT } from "@safestop/types";

import { getSupabaseClient } from "@/lib/auth/client";

type RecentOccurrenceRow = {
  id: string;
  public_code: string;
  title: string;
  status: string;
  severity: string;
  created_at: string;
  areas: { name: string } | { name: string }[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function getRecentOccurrences(
  organizationId: string,
  access: DashboardAccessContext,
  limit = DASHBOARD_RECENT_OCCURRENCES_LIMIT,
): Promise<DashboardRecentOccurrenceItem[]> {
  if (!canAccessOccurrenceMetrics(access)) {
    return [];
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("occurrences")
    .select(
      `
        id,
        public_code,
        title,
        status,
        severity,
        created_at,
        areas ( name )
      `,
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error("Não foi possível carregar ocorrências recentes.");
  }

  return ((data ?? []) as RecentOccurrenceRow[]).map((row) => {
    const area = normalizeJoin(row.areas);

    return {
      id: row.id,
      publicCode: row.public_code,
      title: row.title,
      status: row.status,
      severity: row.severity,
      createdAt: row.created_at,
      areaName: area?.name ?? null,
    };
  });
}

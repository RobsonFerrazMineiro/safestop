import type {
  DashboardAccessContext,
  DashboardDistributionItem,
  DashboardPeriodFilter,
} from "@safestop/types";
import { canAccessOccurrenceMetrics, isOccurrenceStatus } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

type OccurrenceAreaRow = {
  area_id: string;
  areas: { name: string } | { name: string }[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function aggregateByField(
  rows: readonly { id: string; label: string }[],
): DashboardDistributionItem[] {
  const totals = new Map<string, DashboardDistributionItem>();

  for (const row of rows) {
    const current = totals.get(row.id);

    if (current) {
      current.count += 1;
      continue;
    }

    totals.set(row.id, { id: row.id, label: row.label, count: 1 });
  }

  return [...totals.values()].sort((left, right) => right.count - left.count);
}

export async function getOccurrencesByArea(
  organizationId: string,
  access: DashboardAccessContext,
  period: DashboardPeriodFilter,
): Promise<DashboardDistributionItem[] | null> {
  if (!canAccessOccurrenceMetrics(access)) {
    return null;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("occurrences")
    .select(
      `
        area_id,
        areas ( name )
      `,
    )
    .eq("organization_id", organizationId)
    .gte("created_at", period.startAt)
    .lte("created_at", period.endAt);

  if (error) {
    throw new Error("Não foi possível carregar distribuição por área.");
  }

  const mapped = ((data ?? []) as OccurrenceAreaRow[]).map((row) => {
    const area = normalizeJoin(row.areas);

    return {
      id: row.area_id,
      label: area?.name ?? "Área sem nome",
    };
  });

  return aggregateByField(mapped);
}

export async function getOccurrencesByContractor(
  organizationId: string,
  access: DashboardAccessContext,
  period: DashboardPeriodFilter,
): Promise<DashboardDistributionItem[] | null> {
  if (!canAccessOccurrenceMetrics(access)) {
    return null;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("occurrences")
    .select(
      `
        contractor_organization_id,
        contractor_organizations:organizations!occurrences_contractor_organization_id_fkey ( name )
      `,
    )
    .eq("organization_id", organizationId)
    .gte("created_at", period.startAt)
    .lte("created_at", period.endAt)
    .not("contractor_organization_id", "is", null);

  if (error) {
    throw new Error("Não foi possível carregar distribuição por contratada.");
  }

  type ContractorRow = {
    contractor_organization_id: string;
    contractor_organizations: { name: string } | { name: string }[] | null;
  };

  const mapped = ((data ?? []) as ContractorRow[]).map((row) => {
    const contractor = normalizeJoin(row.contractor_organizations);

    return {
      id: row.contractor_organization_id,
      label: contractor?.name ?? "Contratada sem nome",
    };
  });

  return aggregateByField(mapped);
}

export async function getOccurrencesByStatus(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<DashboardDistributionItem[] | null> {
  if (!canAccessOccurrenceMetrics(access)) {
    return null;
  }

  const supabase = createClient();

  const { data, error } = await supabase
    .from("occurrences")
    .select("status")
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error("Não foi possível carregar distribuição por status.");
  }

  const totals = new Map<string, DashboardDistributionItem>();

  for (const row of data ?? []) {
    if (!isOccurrenceStatus(row.status)) {
      continue;
    }

    const current = totals.get(row.status);

    if (current) {
      current.count += 1;
      continue;
    }

    totals.set(row.status, { id: row.status, label: row.status, count: 1 });
  }

  return [...totals.values()].sort((left, right) => right.count - left.count);
}

import type { DashboardAccessContext } from "@safestop/types";
import {
  DASHBOARD_TERMINAL_OCCURRENCE_STATUSES,
  isActiveOccurrence,
  isOccurrenceInAnyContactScope,
  isOccurrenceStatus,
  type OrganizationContactScopeRow,
} from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import { canAccessOperationalMetrics } from "@safestop/types";

type ContactRow = {
  area_id: string | null;
  unit_id: string | null;
  contract_id: string | null;
  management_department_id: string | null;
};

type OccurrenceScopeDbRow = {
  id: string;
  status: string;
  area_id: string;
  unit_id: string | null;
  contract_id: string | null;
  management_department_id: string | null;
};

type NotificationScopeRow = {
  id: string;
  notification_events: { occurrence_id: string | null } | { occurrence_id: string | null }[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function mapContactScope(row: ContactRow): OrganizationContactScopeRow {
  return {
    areaId: row.area_id,
    unitId: row.unit_id,
    contractId: row.contract_id,
    managementDepartmentId: row.management_department_id,
  };
}

export async function getScopedOperationalKpis(
  organizationId: string,
  access: DashboardAccessContext,
): Promise<{ scopedOpenOccurrences: number | null; scopedPendingAwareness: number | null }> {
  if (!canAccessOperationalMetrics(access)) {
    return {
      scopedOpenOccurrences: null,
      scopedPendingAwareness: null,
    };
  }

  const supabase = createClient();

  const [contactsResult, occurrencesResult, notificationsResult] = await Promise.all([
    supabase
      .from("organization_contacts")
      .select("area_id, unit_id, contract_id, management_department_id")
      .eq("organization_id", organizationId)
      .eq("organization_member_id", access.recipientMemberId)
      .eq("is_active", true),
    supabase
      .from("occurrences")
      .select("id, status, area_id, unit_id, contract_id, management_department_id")
      .eq("organization_id", organizationId)
      .not("status", "in", `(${DASHBOARD_TERMINAL_OCCURRENCE_STATUSES.join(",")})`),
    supabase
      .from("notifications")
      .select(
        `
          id,
          notification_events ( occurrence_id )
        `,
      )
      .eq("organization_id", organizationId)
      .eq("recipient_member_id", access.recipientMemberId)
      .eq("requires_awareness", true)
      .is("awareness_confirmed_at", null),
  ]);

  if (contactsResult.error || occurrencesResult.error || notificationsResult.error) {
    throw new Error("Não foi possível carregar indicadores operacionais.");
  }

  const contacts = (contactsResult.data ?? []).map(mapContactScope);

  if (contacts.length === 0) {
    return {
      scopedOpenOccurrences: null,
      scopedPendingAwareness: null,
    };
  }

  const occurrenceById = new Map<string, OccurrenceScopeDbRow>();

  for (const row of (occurrencesResult.data ?? []) as OccurrenceScopeDbRow[]) {
    occurrenceById.set(row.id, row);
  }

  let scopedOpenOccurrences = 0;

  for (const row of occurrenceById.values()) {
    if (!isOccurrenceStatus(row.status) || !isActiveOccurrence(row.status)) {
      continue;
    }

    if (
      isOccurrenceInAnyContactScope(
        {
          areaId: row.area_id,
          unitId: row.unit_id,
          contractId: row.contract_id,
          managementDepartmentId: row.management_department_id,
        },
        contacts,
      )
    ) {
      scopedOpenOccurrences += 1;
    }
  }

  let scopedPendingAwareness = 0;

  for (const row of (notificationsResult.data ?? []) as NotificationScopeRow[]) {
    const event = normalizeJoin(row.notification_events);
    const occurrenceId = event?.occurrence_id;

    if (!occurrenceId) {
      continue;
    }

    const occurrence = occurrenceById.get(occurrenceId);

    if (!occurrence || !isOccurrenceStatus(occurrence.status)) {
      continue;
    }

    if (
      isOccurrenceInAnyContactScope(
        {
          areaId: occurrence.area_id,
          unitId: occurrence.unit_id,
          contractId: occurrence.contract_id,
          managementDepartmentId: occurrence.management_department_id,
        },
        contacts,
      )
    ) {
      scopedPendingAwareness += 1;
    }
  }

  return { scopedOpenOccurrences, scopedPendingAwareness };
}

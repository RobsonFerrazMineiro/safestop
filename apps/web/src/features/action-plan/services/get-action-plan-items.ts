import { isActionItemPriority, isActionItemStatus } from "@safestop/types";

import { createClient } from "@/lib/auth/client";

import type { ActionItemEnriched } from "../types";

type ProfileJoin = { full_name: string | null };
type OrgJoin = { name: string };

type ActionItemRow = {
  id: string;
  action_plan_id: string;
  organization_id: string;
  title: string;
  description: string | null;
  responsible_member_id: string;
  responsible_organization_id: string;
  due_at: string;
  priority: string;
  status: string;
  completion_description: string | null;
  completed_at: string | null;
  completed_by: string | null;
  validated_at: string | null;
  validated_by: string | null;
  validation_note: string | null;
  created_at: string;
  updated_at: string;
  responsible_member:
    | {
        profiles: ProfileJoin | ProfileJoin[] | null;
      }
    | {
        profiles: ProfileJoin | ProfileJoin[] | null;
      }[]
    | null;
  responsible_organization: OrgJoin | OrgJoin[] | null;
  completed_by_profile: ProfileJoin | ProfileJoin[] | null;
};

function normalizeJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value;
}

/** Exportado para testes unitários do mapper. */
export function mapActionItemRow(row: ActionItemRow): ActionItemEnriched | null {
  if (!isActionItemStatus(row.status) || !isActionItemPriority(row.priority)) {
    return null;
  }

  const member = normalizeJoin(row.responsible_member);
  const profile = member ? normalizeJoin(member.profiles) : null;
  const org = normalizeJoin(row.responsible_organization);
  const completedByProfile = normalizeJoin(row.completed_by_profile);

  return {
    id: row.id,
    actionPlanId: row.action_plan_id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    responsibleMemberId: row.responsible_member_id,
    responsibleOrganizationId: row.responsible_organization_id,
    dueAt: row.due_at,
    priority: row.priority,
    status: row.status,
    completionDescription: row.completion_description,
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    validatedAt: row.validated_at,
    validatedBy: row.validated_by,
    validationNote: row.validation_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    responsibleMemberName: profile?.full_name ?? null,
    responsibleOrganizationName: org?.name ?? null,
    completedByName: completedByProfile?.full_name ?? null,
  };
}

/**
 * Select alinhado ao Mobile: FK real `action_items_responsible_member_org_fk`
 * (não `action_items_responsible_member_id_fkey`, inexistente → PGRST200).
 */
export const ACTION_PLAN_ITEMS_SELECT = `
  id,
  action_plan_id,
  organization_id,
  title,
  description,
  responsible_member_id,
  responsible_organization_id,
  due_at,
  priority,
  status,
  completion_description,
  completed_at,
  completed_by,
  validated_at,
  validated_by,
  validation_note,
  created_at,
  updated_at,
  responsible_member:organization_members!action_items_responsible_member_org_fk (
    profiles:profile_id ( full_name )
  ),
  responsible_organization:organizations!action_items_responsible_organization_id_fkey ( name ),
  completed_by_profile:profiles!action_items_completed_by_fkey ( full_name )
`;

export async function getActionPlanItems(
  organizationId: string,
  planId: string,
): Promise<ActionItemEnriched[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("action_items")
    .select(ACTION_PLAN_ITEMS_SELECT)
    .eq("organization_id", organizationId)
    .eq("action_plan_id", planId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar as ações do plano.");
  }

  return (data ?? [])
    .map((row) => mapActionItemRow(row as unknown as ActionItemRow))
    .filter((item): item is ActionItemEnriched => item !== null);
}

export type { ActionItemRow };

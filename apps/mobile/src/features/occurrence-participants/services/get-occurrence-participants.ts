import { getSupabaseClient } from "@/lib/auth/client";

import type { OccurrenceParticipantItem, OccurrenceParticipantType } from "../types";

const PARTICIPANT_TYPE_LABELS: Record<OccurrenceParticipantType, string> = {
  REPORTER: "Relator",
  EVALUATOR: "Avaliador",
  CONTRACTOR_LEADER: "Liderança da Contratada",
  CONTRACT_INSPECTOR: "Fiscal do Contrato",
  HSE_SUPERVISOR: "Supervisor HSE",
  HSE_APPROVER: "Aprovador HSE",
  AREA_MANAGER: "Gerente de Área",
  ACTION_OWNER: "Responsável pela ação",
  RELEASE_APPROVER: "Aprovador de liberação",
  OBSERVER: "Observador",
  ACTIVITY_FOREMAN: "Encarregado da atividade",
};

type ParticipantRow = {
  id: string;
  participant_type: string;
  is_primary: boolean;
  organization_member_id: string;
};

type MemberRow = {
  id: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

function isParticipantType(value: string): value is OccurrenceParticipantType {
  return value in PARTICIPANT_TYPE_LABELS;
}

export function getParticipantTypeLabel(type: OccurrenceParticipantType): string {
  return PARTICIPANT_TYPE_LABELS[type];
}

export async function getOccurrenceParticipants(
  occurrenceId: string,
): Promise<OccurrenceParticipantItem[]> {
  const supabase = getSupabaseClient();

  const { data: participants, error } = await supabase
    .from("occurrence_participants")
    .select("id, participant_type, is_primary, organization_member_id")
    .eq("occurrence_id", occurrenceId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os envolvidos.");
  }

  const rows = (participants ?? []) as ParticipantRow[];

  if (rows.length === 0) {
    return [];
  }

  const memberIds = rows.map((row) => row.organization_member_id);

  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select("id, profiles:profile_id(full_name)")
    .in("id", memberIds);

  if (membersError) {
    throw new Error("Não foi possível carregar os envolvidos.");
  }

  const nameByMemberId = new Map<string, string | null>();

  for (const member of (members ?? []) as MemberRow[]) {
    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
    nameByMemberId.set(member.id, profile?.full_name ?? null);
  }

  const result: OccurrenceParticipantItem[] = [];

  for (const row of rows) {
    if (!isParticipantType(row.participant_type)) {
      continue;
    }

    result.push({
      id: row.id,
      participantType: row.participant_type,
      isPrimary: row.is_primary,
      memberName: nameByMemberId.get(row.organization_member_id) ?? null,
    });
  }

  return result;
}

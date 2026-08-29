import type { OccurrenceParticipantType } from "../types";

export const PARTICIPANT_TYPE_LABELS: Record<OccurrenceParticipantType, string> = {
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

export function isParticipantType(value: string): value is OccurrenceParticipantType {
  return value in PARTICIPANT_TYPE_LABELS;
}

export function getParticipantTypeLabel(type: OccurrenceParticipantType): string {
  return PARTICIPANT_TYPE_LABELS[type];
}

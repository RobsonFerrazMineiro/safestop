import type { NotificationEventType } from "@safestop/types";

const EVENT_TYPE_LABELS: Record<NotificationEventType, string> = {
  OCCURRENCE_CREATED: "Ocorrência registrada",
  DECISION_REQUIRED: "Decisão necessária",
  VER_AND_ACT_REQUIRED: "Ver e Agir necessário",
  INTERDICTION_CONFIRMED: "Interdição confirmada",
  MDHO_APPROVAL_REQUIRED: "Aprovação MDHO necessária",
  MDHO_RETURNED: "MDHO devolvido",
  MDHO_APPROVED: "MDHO aprovado",
  IMS_REFERENCE_REGISTERED: "Referência IMS registrada",
  ACTION_PLAN_CREATED: "Plano de ação criado",
  ACTION_ITEM_ASSIGNED: "Ação atribuída",
  ACTION_ITEM_SUBMITTED: "Ação enviada",
  ACTION_ITEM_VALIDATED: "Ação validada",
  ACTION_ITEM_RETURNED: "Ação devolvida",
  ACTION_PLAN_COMPLETED: "Plano de ação concluído",
};

export function formatNotificationEventType(eventType: NotificationEventType): string {
  return EVENT_TYPE_LABELS[eventType];
}

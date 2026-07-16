import type { OccurrenceSeverity, OccurrenceStatus } from "@safestop/types";

import type { OccurrenceSyncStatus } from "../types";

const STATUS_LABELS: Record<OccurrenceStatus, string> = {
  PARALISACAO_PREVENTIVA: "Paralisação Preventiva",
  EM_AVALIACAO: "Em avaliação",
  VER_E_AGIR: "Ver e Agir",
  INTERDICAO_CONFIRMADA: "Interdição confirmada",
  MDHO_EM_PREENCHIMENTO: "MDHO em preenchimento",
  AGUARDANDO_APROVACAO_HSE: "Aguardando aprovação HSE",
  AGUARDANDO_REGISTRO_IMS: "Aguardando registro IMS",
  EM_TRATATIVA: "Em tratativa",
  AGUARDANDO_VALIDACAO: "Aguardando validação",
  LIBERADA: "Liberada",
  ENCERRADA: "Encerrada",
  CANCELADA: "Cancelada",
};

const SEVERITY_LABELS: Record<OccurrenceSeverity, string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const SYNC_STATUS_LABELS: Record<OccurrenceSyncStatus, string> = {
  saved_locally: "Salvo no dispositivo",
  registered_on_server: "Registrado no servidor",
};

export function getOccurrenceStatusLabel(status: OccurrenceStatus): string {
  return STATUS_LABELS[status];
}

export function getOccurrenceSeverityLabel(severity: OccurrenceSeverity): string {
  return SEVERITY_LABELS[severity];
}

export function getOccurrenceSyncStatusLabel(status: OccurrenceSyncStatus): string {
  return SYNC_STATUS_LABELS[status];
}

export function formatOccurrenceDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

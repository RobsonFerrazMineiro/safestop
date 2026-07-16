/**
 * Status oficiais de ocorrência (docs/database.md §8.5, docs/workflow.md §4).
 */
export const OCCURRENCE_STATUSES = [
  "PARALISACAO_PREVENTIVA",
  "EM_AVALIACAO",
  "VER_E_AGIR",
  "INTERDICAO_CONFIRMADA",
  "MDHO_EM_PREENCHIMENTO",
  "AGUARDANDO_APROVACAO_HSE",
  "AGUARDANDO_REGISTRO_IMS",
  "EM_TRATATIVA",
  "AGUARDANDO_VALIDACAO",
  "LIBERADA",
  "ENCERRADA",
  "CANCELADA",
] as const;

export type OccurrenceStatus = (typeof OCCURRENCE_STATUSES)[number];

export function isOccurrenceStatus(value: string): value is OccurrenceStatus {
  return (OCCURRENCE_STATUSES as readonly string[]).includes(value);
}

/**
 * Criticidade (docs/database.md §8.4).
 */
export const OCCURRENCE_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type OccurrenceSeverity = (typeof OCCURRENCE_SEVERITIES)[number];

export function isOccurrenceSeverity(value: string): value is OccurrenceSeverity {
  return (OCCURRENCE_SEVERITIES as readonly string[]).includes(value);
}

/**
 * Caminho decisório (docs/database.md §8.6).
 */
export const OCCURRENCE_DECISION_TYPES = ["VER_E_AGIR", "INTERDICAO_OFICIAL"] as const;

export type OccurrenceDecisionType = (typeof OCCURRENCE_DECISION_TYPES)[number];

export function isOccurrenceDecisionType(value: string): value is OccurrenceDecisionType {
  return (OCCURRENCE_DECISION_TYPES as readonly string[]).includes(value);
}

/**
 * Estados de sincronização local — não são status de banco (docs/engineering.md §30).
 */
export const OCCURRENCE_SYNC_STATES = ["DRAFT", "SAVED_LOCALLY", "WAITING_FOR_CONNECTION"] as const;

export type OccurrenceSyncState = (typeof OCCURRENCE_SYNC_STATES)[number];

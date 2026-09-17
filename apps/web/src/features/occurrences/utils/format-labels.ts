import type { OccurrenceSeverity, OccurrenceStatus } from "@safestop/types";

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

export function formatOccurrenceStatus(status: OccurrenceStatus): string {
  return STATUS_LABELS[status];
}

export function formatOccurrenceSeverity(severity: OccurrenceSeverity): string {
  return SEVERITY_LABELS[severity];
}

/**
 * Gate 13X.2.10 — "Equipe própria" só sem contratada e sem contrato.
 * Nome do embed nulo (organizations_select) não vira equipe própria: usa o ID.
 */
export function formatOccurrenceContractorDisplay(input: {
  contractorOrganizationId: string | null;
  contractId: string | null;
  contractorOrganizationName: string | null;
}): string {
  const hasContractor =
    input.contractorOrganizationId !== null && input.contractorOrganizationId.length > 0;
  const hasContract = input.contractId !== null && input.contractId.length > 0;

  if (!hasContractor && !hasContract) {
    return "Equipe própria";
  }

  const name = input.contractorOrganizationName?.trim();
  if (name) {
    return name;
  }

  if (hasContractor && input.contractorOrganizationId) {
    return input.contractorOrganizationId;
  }

  return "Contratada";
}

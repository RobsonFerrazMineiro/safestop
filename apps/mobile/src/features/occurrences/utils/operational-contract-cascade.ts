import type { WorkspaceContractOption } from "../types";
import { OWN_TEAM_CONTRACT_OPTION_ID } from "./workspace-create-rules";

export const ACTIVITY_COMPANY_FIELD_LABEL = "Empresa da atividade";

export const ACTIVITY_COMPANY_FIELD_HELP =
  "Executora da atividade neste Ambiente. Não é a EMPRESA do topo.";

export const ACTIVITY_CONTRACT_FIELD_HELP = "Vínculo desta executora neste Ambiente.";

export type OperationalExecutorOption = {
  id: string;
  name: string;
};

type OperationalContractRow = {
  id: string;
  name: string;
  contract_number: string | null;
  contractor_organization_id: string;
  contractor_organization_name: string;
};

type RlsVisibleContractRow = {
  id: string;
  name: string;
  contract_number: string | null;
  contractor_organization_id: string;
};

function isOperationalContractRow(value: unknown): value is OperationalContractRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    (row.contract_number === null || typeof row.contract_number === "string") &&
    typeof row.contractor_organization_id === "string" &&
    typeof row.contractor_organization_name === "string"
  );
}

export function mapOperationalWorkspaceContractRows(data: unknown): WorkspaceContractOption[] {
  if (!Array.isArray(data)) {
    return [];
  }

  const options: WorkspaceContractOption[] = [];

  for (const item of data) {
    if (!isOperationalContractRow(item)) {
      continue;
    }

    options.push({
      id: item.id,
      name: item.name,
      contractNumber: item.contract_number,
      contractorOrganizationId: item.contractor_organization_id,
      contractorOrganizationName: item.contractor_organization_name,
    });
  }

  return options;
}

/**
 * Fallback CONTRATADA: sem embed de organizations.
 * Nome da executora só se a org atuante for a contractor; senão name/number do Contract.
 */
export function mapRlsVisibleWorkspaceContractRows(
  rows: RlsVisibleContractRow[],
  acting: { organizationId: string; organizationName: string | null },
): WorkspaceContractOption[] {
  return rows.map((row) => {
    const isActingContractor = row.contractor_organization_id === acting.organizationId;
    const numberPart = row.contract_number?.trim();
    const fallbackName =
      isActingContractor && acting.organizationName
        ? acting.organizationName
        : numberPart && numberPart.length > 0
          ? numberPart
          : row.name;

    return {
      id: row.id,
      name: row.name,
      contractNumber: row.contract_number,
      contractorOrganizationId: row.contractor_organization_id,
      contractorOrganizationName: fallbackName,
    };
  });
}

export function formatWorkspaceContractLabel(contract: WorkspaceContractOption): string {
  const numberPart = contract.contractNumber?.trim();
  if (numberPart) {
    return `${numberPart} — ${contract.contractorOrganizationName}`;
  }

  return `${contract.name} — ${contract.contractorOrganizationName}`;
}

export function distinctOperationalExecutors(
  contracts: WorkspaceContractOption[],
): OperationalExecutorOption[] {
  const namesById = new Map<string, string>();

  for (const contract of contracts) {
    if (!namesById.has(contract.contractorOrganizationId)) {
      namesById.set(contract.contractorOrganizationId, contract.contractorOrganizationName);
    }
  }

  return [...namesById.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
}

export function contractsForExecutor(
  contracts: WorkspaceContractOption[],
  executorOrganizationId: string,
): WorkspaceContractOption[] {
  if (!executorOrganizationId || executorOrganizationId === OWN_TEAM_CONTRACT_OPTION_ID) {
    return [];
  }

  return contracts.filter(
    (contract) => contract.contractorOrganizationId === executorOrganizationId,
  );
}

export function deriveCreatePayloadFromContract(contract: WorkspaceContractOption): {
  contractId: string;
  contractorOrganizationId: string;
} {
  return {
    contractId: contract.id,
    contractorOrganizationId: contract.contractorOrganizationId,
  };
}

export function resolveExecutorIdFromDraft(input: {
  allowsOwnTeam: boolean;
  contractId: string | undefined;
  contractorOrganizationId: string | undefined;
  contracts: WorkspaceContractOption[];
}): string {
  if (input.contractId) {
    const selected = input.contracts.find((contract) => contract.id === input.contractId);
    if (selected) {
      return selected.contractorOrganizationId;
    }
  }

  if (
    input.allowsOwnTeam &&
    (input.contractId === undefined || input.contractId === "") &&
    (input.contractorOrganizationId === undefined || input.contractorOrganizationId === "")
  ) {
    return OWN_TEAM_CONTRACT_OPTION_ID;
  }

  if (input.contractorOrganizationId) {
    const hasExecutor = input.contracts.some(
      (contract) => contract.contractorOrganizationId === input.contractorOrganizationId,
    );
    if (hasExecutor) {
      return input.contractorOrganizationId;
    }
  }

  return "";
}

export function resolveOperationalCreateContractFields(input: {
  executorId: string;
  allowsOwnTeam: boolean;
  contracts: WorkspaceContractOption[];
  contractId: string | undefined;
}): {
  contractId: string | undefined;
  contractorOrganizationId: string | undefined;
} | null {
  if (input.allowsOwnTeam && input.executorId === OWN_TEAM_CONTRACT_OPTION_ID) {
    return {
      contractId: undefined,
      contractorOrganizationId: undefined,
    };
  }

  if (!input.contractId) {
    return null;
  }

  const selected = input.contracts.find((contract) => contract.id === input.contractId);
  if (!selected) {
    return null;
  }

  if (selected.contractorOrganizationId !== input.executorId) {
    return null;
  }

  return deriveCreatePayloadFromContract(selected);
}

export function isOperationalWorkspaceContractsForbidden(error: {
  code?: string;
  message?: string;
}): boolean {
  const code = error.code ?? "";
  const message = (error.message ?? "").toUpperCase();

  return code === "42501" || message.includes("FORBIDDEN");
}

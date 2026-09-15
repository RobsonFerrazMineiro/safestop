export const EMPTY_ACTIVE_CONTRACTORS_MESSAGE = "Nenhum contrato ativo neste Ambiente.";

export type PreventiveStopCreateControlState = {
  isAreaDisabled: boolean;
  isContractorDisabled: boolean;
  areIndependentFieldsDisabled: boolean;
  isSubmitDisabled: boolean;
  showEmptyContractorsMessage: boolean;
};

/**
 * Empty de contrato não bloqueia o restante do formulário quando equipe própria é permitida.
 */
export function getPreventiveStopCreateControlState(input: {
  isCreating: boolean;
  isOffline: boolean;
  areasCount: number;
  contractsCount: number;
  hasActiveWorkspace: boolean;
  allowsOwnTeam: boolean;
}): PreventiveStopCreateControlState {
  const hasAreas = input.areasCount > 0;
  const hasWorkspace = input.hasActiveWorkspace;
  const hasContractOptions = input.contractsCount > 0 || input.allowsOwnTeam;
  const contractRequired = !input.allowsOwnTeam;

  return {
    isAreaDisabled: input.isCreating || !hasAreas || !hasWorkspace,
    isContractorDisabled: input.isCreating || !hasWorkspace || !hasContractOptions,
    areIndependentFieldsDisabled: input.isCreating || !hasWorkspace,
    isSubmitDisabled:
      input.isCreating ||
      input.isOffline ||
      !hasAreas ||
      !hasWorkspace ||
      (contractRequired && input.contractsCount === 0),
    showEmptyContractorsMessage: input.contractsCount === 0 && !input.allowsOwnTeam,
  };
}

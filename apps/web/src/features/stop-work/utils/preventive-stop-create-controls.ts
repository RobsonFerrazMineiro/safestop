export const EMPTY_ACTIVE_CONTRACTORS_MESSAGE =
  "Nenhuma contratada com contrato ativo nesta organização.";

export type PreventiveStopCreateControlState = {
  isAreaDisabled: boolean;
  isContractorDisabled: boolean;
  areIndependentFieldsDisabled: boolean;
  isSubmitDisabled: boolean;
  showEmptyContractorsMessage: boolean;
};

/**
 * Empty de contratada não bloqueia o restante do formulário.
 * Loading/submit (`isCreating`) continua desabilitando os controles.
 */
export function getPreventiveStopCreateControlState(input: {
  isCreating: boolean;
  areasCount: number;
  contractorsCount: number;
}): PreventiveStopCreateControlState {
  const hasAreas = input.areasCount > 0;
  const hasContractors = input.contractorsCount > 0;

  return {
    isAreaDisabled: input.isCreating || !hasAreas,
    isContractorDisabled: input.isCreating || !hasContractors,
    areIndependentFieldsDisabled: input.isCreating,
    isSubmitDisabled: input.isCreating || !hasAreas || !hasContractors,
    showEmptyContractorsMessage: !hasContractors,
  };
}

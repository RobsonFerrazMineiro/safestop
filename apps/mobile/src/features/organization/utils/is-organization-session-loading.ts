/**
 * Gate 13X.2.14 — isLoading da sessão de org é carga inicial.
 * refetchOnWindowFocus (isFetching) com org já resolvida NÃO desmonta o navigator.
 */
export function isOrganizationSessionLoading(input: {
  isListLoading: boolean;
  isFetching: boolean;
  hasResolvedActiveOrganization: boolean;
}): boolean {
  return input.isListLoading || !input.hasResolvedActiveOrganization;
}

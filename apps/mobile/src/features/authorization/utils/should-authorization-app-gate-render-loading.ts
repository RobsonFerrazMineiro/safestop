/**
 * Gate 13X.2.14 — refetch de authz (isSwitching) não substitui o navigator autenticado.
 */
export function shouldAuthorizationAppGateRenderLoading(input: {
  isLoading: boolean;
  isSwitching: boolean;
}): boolean {
  return input.isLoading && !input.isSwitching;
}

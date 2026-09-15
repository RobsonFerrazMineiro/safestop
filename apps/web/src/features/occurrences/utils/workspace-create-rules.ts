/**
 * Gate 13X.3 — detalhe não pré-filtra pela EMPRESA atuante.
 * Autorização: RLS / can_read_occurrence_record.
 */
export function buildOccurrenceDetailLookup(occurrenceId: string): {
  occurrenceId: string;
  filterByActingOrganization: false;
} {
  return {
    occurrenceId,
    filterByActingOrganization: false,
  };
}

/**
 * Dual-read de áreas do ambiente (ADR-006 / 13X.2.1).
 * - areas.workspace_id = ambiente ativo
 * - OU (workspace_id IS NULL AND organization_id = owner do ambiente)
 */
export function buildWorkspaceAreasOrFilter(input: {
  workspaceId: string;
  ownerOrganizationId: string | null;
}): string {
  if (!input.ownerOrganizationId) {
    return `workspace_id.eq.${input.workspaceId}`;
  }

  return `workspace_id.eq.${input.workspaceId},and(workspace_id.is.null,organization_id.eq.${input.ownerOrganizationId})`;
}

export const OWN_TEAM_CONTRACT_OPTION_ID = "__own_team__" as const;

export function canSelectOwnTeam(input: {
  actingOrganizationId: string;
  ownerOrganizationId: string | null;
}): boolean {
  return (
    input.ownerOrganizationId !== null && input.ownerOrganizationId === input.actingOrganizationId
  );
}

export function isContractRequiredForCreate(input: {
  actingOrganizationId: string;
  ownerOrganizationId: string | null;
}): boolean {
  return !canSelectOwnTeam(input);
}

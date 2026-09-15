import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { mapOccurrenceDetailsRow } from "@/features/occurrences/services/map-occurrence";
import {
  buildOccurrenceDetailLookup,
  buildWorkspaceAreasOrFilter,
  buildWorkspaceContractsQuery,
  canSelectOwnTeam,
  isContractRequiredForCreate,
} from "@/features/occurrences/utils/workspace-create-rules";
import { STOP_WORK_LIST_WORKSPACE_SERVER_FILTER_READY } from "@/features/stop-work/constants/workspace-list-scoping";

describe("Gate 13X.4 — copy EMPRESA / AMBIENTE", () => {
  it("header e Switcher usam EMPRESA e AMBIENTE", () => {
    const header = readFileSync(
      resolve(process.cwd(), "src/features/dashboard/components/home-header.tsx"),
      "utf8",
    );
    const switcher = readFileSync(
      resolve(process.cwd(), "src/features/workspace/components/workspace-switcher.tsx"),
      "utf8",
    );

    expect(header).toContain("EMPRESA");
    expect(header).not.toContain("ORGANIZAÇÃO");
    expect(switcher).toContain("AMBIENTE");
    expect(switcher).not.toMatch(/\bWORKSPACE\b/);
  });
});

describe("Gate 13X.4 — detalhe e create rules", () => {
  it("getOccurrence lookup não filtra pela EMPRESA atuante", () => {
    expect(buildOccurrenceDetailLookup("occ-1")).toEqual({
      occurrenceId: "occ-1",
      filterByActingOrganization: false,
    });

    const getOccurrenceSource = readFileSync(
      resolve(process.cwd(), "src/features/occurrences/services/get-occurrence.ts"),
      "utf8",
    );
    expect(getOccurrenceSource).toContain('eq("id", lookup.occurrenceId)');
    expect(getOccurrenceSource).not.toMatch(/\.eq\(\s*"organization_id"/);
  });

  it("mapper distingue origin, contractor e tenant", () => {
    const mapped = mapOccurrenceDetailsRow({
      id: "occ-1",
      public_code: "PP-1",
      title: "Teste",
      status: "EM_AVALIACAO",
      severity: "HIGH",
      created_at: "2026-01-01T00:00:00.000Z",
      area_id: "area-1",
      unit_id: null,
      contract_id: "ctr-1",
      workspace_id: "ws-1",
      origin_organization_id: "org-tuv",
      task_description: "Atividade",
      location_description: "Local",
      condition_description: "Condição",
      immediate_action_description: null,
      decision_type: null,
      latitude: null,
      longitude: null,
      location_accuracy: null,
      occurred_at: "2026-01-01T00:00:00.000Z",
      stopped_at: null,
      organization_id: "org-hydro",
      contractor_organization_id: "org-tuv",
      created_by: "user-1",
      evaluated_at: null,
      released_at: null,
      closed_at: null,
      cancelled_at: null,
      ims_reference_code: null,
      ims_reference_registered_at: null,
      ims_reference_registered_by: null,
      ims_reference_updated_at: null,
      ims_reference_updated_by: null,
      assigned_evaluator_id: null,
      evaluator: null,
      ims_registered_by: null,
      ims_updated_by: null,
      occurrence_decisions: null,
      areas: { name: "Clarificação" },
      profiles: { full_name: "Operador" },
      contractor_organizations: { name: "TÜV" },
      origin_organizations: { name: "TÜV" },
    });

    expect(mapped?.organizationId).toBe("org-hydro");
    expect(mapped?.originOrganizationId).toBe("org-tuv");
    expect(mapped?.originOrganizationName).toBe("TÜV");
    expect(mapped?.contractorOrganizationId).toBe("org-tuv");
    expect(mapped?.contractorOrganizationName).toBe("TÜV");
  });

  it("equipe própria só quando atuante === owner; owner null exige contrato", () => {
    expect(
      canSelectOwnTeam({
        actingOrganizationId: "org-hydro",
        ownerOrganizationId: "org-hydro",
      }),
    ).toBe(true);
    expect(
      canSelectOwnTeam({
        actingOrganizationId: "org-tuv",
        ownerOrganizationId: "org-hydro",
      }),
    ).toBe(false);
    expect(
      canSelectOwnTeam({
        actingOrganizationId: "org-hydro",
        ownerOrganizationId: null,
      }),
    ).toBe(false);
    expect(
      isContractRequiredForCreate({
        actingOrganizationId: "org-tuv",
        ownerOrganizationId: "org-hydro",
      }),
    ).toBe(true);
    expect(
      isContractRequiredForCreate({
        actingOrganizationId: "org-hydro",
        ownerOrganizationId: null,
      }),
    ).toBe(true);
  });

  it("dual-read de áreas usa workspace ou legado do owner", () => {
    expect(
      buildWorkspaceAreasOrFilter({
        workspaceId: "ws-1",
        ownerOrganizationId: "org-hydro",
      }),
    ).toBe("workspace_id.eq.ws-1,and(workspace_id.is.null,organization_id.eq.org-hydro)");

    expect(
      buildWorkspaceAreasOrFilter({
        workspaceId: "ws-1",
        ownerOrganizationId: null,
      }),
    ).toBe("workspace_id.eq.ws-1");
  });

  it("contratos do create filtram por workspace_id do Ambiente", () => {
    expect(buildWorkspaceContractsQuery("ws-hydro")).toEqual({
      workspaceId: "ws-hydro",
      isActive: true,
    });

    const contractsSource = readFileSync(
      resolve(process.cwd(), "src/features/occurrences/services/get-workspace-contracts.ts"),
      "utf8",
    );
    expect(contractsSource).not.toMatch(/\.eq\(\s*"client_organization_id"/);
  });

  it("create não envia origin_organization_id e não usa get-contracts legado", () => {
    const createSource = readFileSync(
      resolve(process.cwd(), "src/features/occurrences/services/create-occurrence.ts"),
      "utf8",
    );
    const screenSource = readFileSync(
      resolve(process.cwd(), "src/features/stop-work/components/preventive-stop-create-screen.tsx"),
      "utf8",
    );

    expect(createSource).not.toContain("origin_organization_id");
    expect(screenSource).toContain("useWorkspaceContracts");
    expect(screenSource).toContain("useWorkspaceAreas");
    expect(screenSource).not.toContain("useOccurrenceContracts");
    expect(screenSource).not.toContain("useOccurrenceContractors");
    expect(screenSource).not.toContain("get-contracts");
  });

  it("lista operacional permanece com filtro server-side de Workspace", () => {
    expect(STOP_WORK_LIST_WORKSPACE_SERVER_FILTER_READY).toBe(true);
  });
});

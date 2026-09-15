import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { mapOccurrenceDetailRow } from "@/features/occurrences/utils/map-occurrence";
import {
  buildOccurrenceDetailLookup,
  buildWorkspaceAreasOrFilter,
  canSelectOwnTeam,
  isContractRequiredForCreate,
} from "@/features/occurrences/utils/workspace-create-rules";
import { STOP_WORK_LIST_WORKSPACE_SERVER_FILTER_READY } from "@/features/stop-work/constants/workspace-list-scoping";

describe("Gate 13X.3 — copy EMPRESA / AMBIENTE", () => {
  it("Topbar e Switcher usam EMPRESA e AMBIENTE", () => {
    const topbar = readFileSync(
      resolve(process.cwd(), "src/features/navigation/components/app-topbar.tsx"),
      "utf8",
    );
    const switcher = readFileSync(
      resolve(process.cwd(), "src/features/workspace/components/workspace-switcher.tsx"),
      "utf8",
    );

    expect(topbar).toContain("EMPRESA");
    expect(topbar).not.toContain("ORGANIZAÇÃO");
    expect(switcher).toContain("AMBIENTE");
    expect(switcher).not.toMatch(/\bWORKSPACE\b/);
  });
});

describe("Gate 13X.3 — detalhe e create rules", () => {
  it("getOccurrence lookup não filtra pela EMPRESA atuante", () => {
    expect(buildOccurrenceDetailLookup("occ-1")).toEqual({
      occurrenceId: "occ-1",
      filterByActingOrganization: false,
    });
  });

  it("mapper distingue origin, contractor e tenant", () => {
    const mapped = mapOccurrenceDetailRow({
      id: "occ-1",
      public_code: "PP-1",
      title: "Teste",
      status: "EM_AVALIACAO",
      severity: "HIGH",
      created_at: "2026-01-01T00:00:00.000Z",
      area_id: "area-1",
      unit_id: null,
      contract_id: "ctr-1",
      management_department_id: null,
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
      ims_registered_by_profile: null,
      ims_updated_by_profile: null,
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

  it("equipe própria só quando atuante === owner", () => {
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

  it("contratos do create filtram por workspace_id do Ambiente", async () => {
    const { buildWorkspaceContractsQuery } =
      await import("@/features/occurrences/services/get-workspace-contracts");
    expect(buildWorkspaceContractsQuery("ws-hydro")).toEqual({
      workspaceId: "ws-hydro",
      isActive: true,
    });
  });

  it("lista operacional permanece com filtro server-side de Workspace", () => {
    expect(STOP_WORK_LIST_WORKSPACE_SERVER_FILTER_READY).toBe(true);
  });
});

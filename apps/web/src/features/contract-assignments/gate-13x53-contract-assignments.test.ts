import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { mapContractAssignmentRow } from "./services/list-contract-assignments";
import { buildWorkspaceContractsQuery } from "./services/list-workspace-contracts";
import { canEditContractAssignment } from "./utils/assignment-rules";

describe("Gate 13X.5.3 — responsáveis do contrato", () => {
  it("editabilidade só quando assignment.organizationId === EMPRESA atuante", () => {
    expect(
      canEditContractAssignment({
        assignmentOrganizationId: "org-tuv",
        actingOrganizationId: "org-tuv",
      }),
    ).toBe(true);
    expect(
      canEditContractAssignment({
        assignmentOrganizationId: "org-hydro",
        actingOrganizationId: "org-tuv",
      }),
    ).toBe(false);
  });

  it("editabilidade não usa papel da EMPRESA no Ambiente", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/features/contract-assignments/utils/assignment-rules.ts"),
      "utf8",
    );
    expect(source).toContain("assignmentOrganizationId === input.actingOrganizationId");
    expect(source).not.toMatch(/GERENCIADORA|CONTRATADA/);
  });

  it("consulta de contratos filtra por workspace_id, sem client_organization_id", () => {
    expect(buildWorkspaceContractsQuery("ws-hydro")).toEqual({
      workspaceId: "ws-hydro",
      isActive: true,
    });

    const source = readFileSync(
      resolve(process.cwd(), "src/features/occurrences/services/get-workspace-contracts.ts"),
      "utf8",
    );
    expect(source).toContain('.eq("workspace_id", filter.workspaceId)');
    expect(source).not.toMatch(/\.eq\(\s*["']client_organization_id["']/);
  });

  it("mapper preserva EMPRESA do member e assignment_role, sem inferir GERENCIADORA", () => {
    const mapped = mapContractAssignmentRow({
      id: "asg-1",
      contract_id: "ctr-1",
      organization_id: "org-hydro",
      organization_member_id: "mem-1",
      assignment_role: "FISCAL",
      is_active: true,
      granted_at: "2026-01-01T00:00:00.000Z",
      revoked_at: null,
      organizations: { name: "Hydro" },
      organization_members: {
        id: "mem-1",
        profiles: { full_name: "Ana Fiscal" },
      },
    });

    expect(mapped).toMatchObject({
      organizationId: "org-hydro",
      organizationName: "Hydro",
      memberName: "Ana Fiscal",
      assignmentRole: "FISCAL",
      isActive: true,
    });
  });

  it("copy da Topbar continua EMPRESA / AMBIENTE, sem WORKSPACE/ORGANIZAÇÃO como label", () => {
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

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { ASSIGNABLE_MEMBERS_EMPTY_MESSAGE } from "./components/contract-assignment-add-form";
import { buildAssignableMembersQuery } from "./services/list-assignable-members";
import { buildWorkspaceContractsQuery } from "./services/list-workspace-contracts";
import { canEditContractAssignment } from "./utils/assignment-rules";

describe("Gate 13X.5.5 — picker de colegas da EMPRESA no Ambiente", () => {
  it("query de memberships filtra org + Ambiente, sem client_organization_id", () => {
    expect(
      buildAssignableMembersQuery({
        organizationId: "org-hydro",
        workspaceId: "ws-hydro",
      }),
    ).toEqual({
      organizationId: "org-hydro",
      workspaceId: "ws-hydro",
      isActive: true,
    });

    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/features/contract-assignments/services/list-assignable-members.ts",
      ),
      "utf8",
    );
    expect(source).toContain('.from("workspace_memberships")');
    expect(source).toContain('.eq("workspace_id", filter.workspaceId)');
    expect(source).toContain('.eq("organization_id", filter.organizationId)');
    expect(source).not.toMatch(/\.from\("organization_members"\)/);
    expect(source).not.toMatch(/\.eq\(\s*["']client_organization_id["']/);
    expect(source).not.toMatch(/GERENCIADORA|ownerOrganizationId/);
  });

  it("contratos do Ambiente continuam sem client_organization_id", () => {
    expect(buildWorkspaceContractsQuery("ws-hydro")).toEqual({
      workspaceId: "ws-hydro",
      isActive: true,
    });
  });

  it("canEdit só quando assignment.organizationId === actingOrg", () => {
    expect(
      canEditContractAssignment({
        assignmentOrganizationId: "org-beta",
        actingOrganizationId: "org-beta",
      }),
    ).toBe(true);
    expect(
      canEditContractAssignment({
        assignmentOrganizationId: "org-hydro",
        actingOrganizationId: "org-beta",
      }),
    ).toBe(false);
  });

  it("empty operacional não sugere falha de permissão de banco", () => {
    expect(ASSIGNABLE_MEMBERS_EMPTY_MESSAGE).toBe(
      "Ninguém da sua EMPRESA possui acesso a este Ambiente.",
    );
    expect(ASSIGNABLE_MEMBERS_EMPTY_MESSAGE.toLowerCase()).not.toMatch(/permissão|banco|rls|403/);
  });
});

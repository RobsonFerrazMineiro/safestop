import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { WorkspaceContractOption } from "@/features/occurrences/types";
import {
  ACTIVITY_COMPANY_FIELD_HELP,
  ACTIVITY_COMPANY_FIELD_LABEL,
  contractsForExecutor,
  deriveCreatePayloadFromContract,
  distinctOperationalExecutors,
  isOperationalWorkspaceContractsForbidden,
  mapOperationalWorkspaceContractRows,
  mapRlsVisibleWorkspaceContractRows,
  resolveOperationalCreateContractFields,
} from "@/features/occurrences/utils/operational-contract-cascade";
import { canSelectOwnTeam } from "@/features/occurrences/utils/workspace-create-rules";
import { EMPTY_ACTIVE_CONTRACTORS_MESSAGE } from "@/features/stop-work/utils/preventive-stop-create-controls";

const epsilonA: WorkspaceContractOption = {
  id: "ctr-eps-1",
  name: "Manutenção elétrica",
  contractNumber: "EPS-01",
  contractorOrganizationId: "org-epsilon",
  contractorOrganizationName: "Epsilon",
};

const epsilonB: WorkspaceContractOption = {
  id: "ctr-eps-2",
  name: "Caldeiraria",
  contractNumber: "EPS-02",
  contractorOrganizationId: "org-epsilon",
  contractorOrganizationName: "Epsilon",
};

const kw: WorkspaceContractOption = {
  id: "ctr-kw-1",
  name: "Civil",
  contractNumber: "KW-01",
  contractorOrganizationId: "org-kw",
  contractorOrganizationName: "KW",
};

describe("Gate 13X.2.5 — cascata operacional do Create mobile", () => {
  it("distinct executoras a partir da RPC, sem duplicar a mesma org", () => {
    expect(distinctOperationalExecutors([epsilonB, kw, epsilonA])).toEqual([
      { id: "org-epsilon", name: "Epsilon" },
      { id: "org-kw", name: "KW" },
    ]);
  });

  it("segundo select filtra contratos pela executora escolhida", () => {
    expect(contractsForExecutor([epsilonA, epsilonB, kw], "org-epsilon")).toEqual([
      epsilonA,
      epsilonB,
    ]);
    expect(contractsForExecutor([epsilonA, kw], "org-kw")).toEqual([kw]);
  });

  it("payload deriva contractor do Contract e rejeita cruzamento de executoras", () => {
    expect(deriveCreatePayloadFromContract(kw)).toEqual({
      contractId: "ctr-kw-1",
      contractorOrganizationId: "org-kw",
    });

    expect(
      resolveOperationalCreateContractFields({
        executorId: "org-epsilon",
        allowsOwnTeam: false,
        contracts: [epsilonA, kw],
        contractId: kw.id,
      }),
    ).toBeNull();

    expect(
      resolveOperationalCreateContractFields({
        executorId: "org-epsilon",
        allowsOwnTeam: false,
        contracts: [epsilonA, kw],
        contractId: epsilonA.id,
      }),
    ).toEqual({
      contractId: "ctr-eps-1",
      contractorOrganizationId: "org-epsilon",
    });
  });

  it("canSelectOwnTeam só quando atuante é owner do Ambiente", () => {
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
  });

  it("copy Empresa da atividade não é a EMPRESA do switcher", () => {
    expect(ACTIVITY_COMPANY_FIELD_LABEL).toBe("Empresa da atividade");
    expect(ACTIVITY_COMPANY_FIELD_LABEL).not.toBe("EMPRESA");
    expect(ACTIVITY_COMPANY_FIELD_HELP).toContain("Não é a EMPRESA do topo");
  });

  it("Create não chama getWorkspaceContracts com embed", () => {
    const service = readFileSync(
      resolve(
        process.cwd(),
        "src/features/occurrences/services/list-operational-workspace-contracts.ts",
      ),
      "utf8",
    );
    const hook = readFileSync(
      resolve(process.cwd(), "src/features/occurrences/hooks/use-workspace-contracts.ts"),
      "utf8",
    );
    const create = readFileSync(
      resolve(process.cwd(), "src/features/stop-work/components/preventive-stop-create-screen.tsx"),
      "utf8",
    );

    expect(service).toContain('rpc("list_operational_workspace_contracts"');
    expect(service).toContain("p_workspace_id");
    expect(service).not.toContain("client_organization_id");
    expect(service).not.toMatch(/organizations!/);
    expect(service).not.toMatch(/\.from\("organizations"\)/);
    expect(service).not.toMatch(/\.from\("workspace_memberships"\)/);
    expect(hook).toContain("listOperationalWorkspaceContracts");
    expect(hook).not.toContain("getWorkspaceContracts(");
    expect(create).toContain("Empresa da atividade");
    expect(create).not.toContain("getWorkspaceContracts");
    expect(create).not.toContain("organization.manage");
    expect(create).not.toContain("contract-assignments");
  });

  it("RPC 42501 não usa copy de permissão de banco", () => {
    expect(
      isOperationalWorkspaceContractsForbidden({
        code: "42501",
        message: "FORBIDDEN",
      }),
    ).toBe(true);
    expect(mapOperationalWorkspaceContractRows(null)).toEqual([]);
    expect(EMPTY_ACTIVE_CONTRACTORS_MESSAGE.toLowerCase()).not.toMatch(/permissão|banco|rls/);
  });

  it("mapper da RPC preserva o Contract e o nome da executora", () => {
    expect(
      mapOperationalWorkspaceContractRows([
        {
          id: "ctr-eps-1",
          name: "Manutenção elétrica",
          contract_number: "EPS-01",
          contractor_organization_id: "org-epsilon",
          contractor_organization_name: "Epsilon",
        },
      ]),
    ).toEqual([epsilonA]);
  });

  it("fallback CONTRATADA usa nome da EMPRESA atuante sem embed de terceiros", () => {
    expect(
      mapRlsVisibleWorkspaceContractRows(
        [
          {
            id: "ctr-eps-1",
            name: "Manutenção elétrica",
            contract_number: "EPS-01",
            contractor_organization_id: "org-epsilon",
          },
        ],
        { organizationId: "org-epsilon", organizationName: "Epsilon" },
      ),
    ).toEqual([epsilonA]);

    expect(
      mapRlsVisibleWorkspaceContractRows(
        [
          {
            id: "ctr-kw-1",
            name: "Civil",
            contract_number: "KW-01",
            contractor_organization_id: "org-kw",
          },
        ],
        { organizationId: "org-epsilon", organizationName: "Epsilon" },
      )[0]?.contractorOrganizationName,
    ).toBe("KW-01");
  });
});

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { mapOperationalWorkspaceContractRows } from "@/features/occurrences/services/list-operational-workspace-contracts";
import type { WorkspaceContractOption } from "@/features/occurrences/types";
import {
  ACTIVITY_COMPANY_FIELD_HELP,
  ACTIVITY_COMPANY_FIELD_LABEL,
  contractsForExecutor,
  deriveCreatePayloadFromContract,
  distinctOperationalExecutors,
  isOperationalWorkspaceContractsForbidden,
  mapRlsVisibleWorkspaceContractRows,
  resolveOperationalCreateContractFields,
  shouldFallbackToRlsVisibleWorkspaceContracts,
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

describe("Gate 13X.2.4 — cascata operacional do Create", () => {
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

  it("copy Empresa da atividade não é a EMPRESA do topbar", () => {
    expect(ACTIVITY_COMPANY_FIELD_LABEL).toBe("Empresa da atividade");
    expect(ACTIVITY_COMPANY_FIELD_LABEL).not.toBe("EMPRESA");
    expect(ACTIVITY_COMPANY_FIELD_HELP).toContain("Não é a EMPRESA do topo");
  });

  it("Create WS não filtra client_organization_id = atuante", () => {
    const service = readFileSync(
      resolve(
        process.cwd(),
        "src/features/occurrences/services/list-operational-workspace-contracts.ts",
      ),
      "utf8",
    );
    const hook = readFileSync(
      resolve(process.cwd(), "src/features/occurrences/hooks/use-occurrences.ts"),
      "utf8",
    );
    const create = readFileSync(
      resolve(process.cwd(), "src/features/stop-work/components/stop-work-create-container.tsx"),
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
    expect(create).not.toContain("client_organization_id");
    expect(create).not.toContain("/contract-assignments");
    expect(create).not.toContain("organization.manage");
    expect(create).toContain("Empresa da atividade");
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
});

describe("Gate 13X.2.4.1 — fallback CONTRATADA só em FORBIDDEN", () => {
  it("fallback só em 42501/FORBIDDEN, não em RPC [] com sucesso", () => {
    expect(
      shouldFallbackToRlsVisibleWorkspaceContracts({
        code: "42501",
        message: "FORBIDDEN",
      }),
    ).toBe(true);
    expect(shouldFallbackToRlsVisibleWorkspaceContracts(null)).toBe(false);
    expect(
      shouldFallbackToRlsVisibleWorkspaceContracts({
        code: "28000",
        message: "UNAUTHORIZED",
      }),
    ).toBe(false);
    expect(mapOperationalWorkspaceContractRows([])).toEqual([]);
    expect(isOperationalWorkspaceContractsForbidden({ code: "42501" })).toBe(true);

    const service = readFileSync(
      resolve(
        process.cwd(),
        "src/features/occurrences/services/list-operational-workspace-contracts.ts",
      ),
      "utf8",
    );
    const listFn = service.slice(
      service.indexOf("export async function listOperationalWorkspaceContracts"),
    );
    expect(listFn).toContain("shouldFallbackToRlsVisibleWorkspaceContracts(error)");
    expect(listFn).toContain("return listRlsVisibleWorkspaceContracts(params)");
    expect(listFn).toContain("return mapOperationalWorkspaceContractRows(data)");
    expect(listFn.indexOf("if (error)")).toBeLessThan(
      listFn.indexOf("listRlsVisibleWorkspaceContracts"),
    );
    expect(service).not.toMatch(/\.from\("organizations"\)/);
    expect(service).not.toMatch(/organizations!/);
    expect(service).toContain('.select("id, name, contract_number, contractor_organization_id")');
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

    expect(
      mapRlsVisibleWorkspaceContractRows(
        [
          {
            id: "ctr-kw-1",
            name: "Civil",
            contract_number: null,
            contractor_organization_id: "org-kw",
          },
        ],
        { organizationId: "org-epsilon", organizationName: "Epsilon" },
      )[0]?.contractorOrganizationName,
    ).toBe("Civil");
  });
});

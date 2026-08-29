import { describe, expect, it } from "vitest";

import { buildOrganizationContactFormPayload } from "./organization-contact-form-payload";

const BASE_VALUES = {
  organizationMemberId: "11111111-1111-4111-8111-111111111111",
  contactType: "HSE_SUPERVISOR" as const,
  priority: "100",
  unitId: "",
  areaId: "",
  contractId: "",
};

describe("buildOrganizationContactFormPayload", () => {
  it("rejeita create/update sem membro", () => {
    const result = buildOrganizationContactFormPayload(
      { ...BASE_VALUES, organizationMemberId: "" },
      false,
    );

    expect(result).toEqual({ error: "Selecione o membro responsável." });
  });

  it("exige contrato somente quando o tipo requer", () => {
    const withoutContract = buildOrganizationContactFormPayload(BASE_VALUES, true);
    const optionalContract = buildOrganizationContactFormPayload(BASE_VALUES, false);

    expect(withoutContract).toEqual({
      error: "Contrato é obrigatório para este tipo de contato.",
    });
    expect("payload" in optionalContract).toBe(true);
    if ("payload" in optionalContract) {
      expect(optionalContract.payload.contractId).toBeNull();
    }
  });

  it("rejeita prioridade inválida e monta payload create/update equivalente", () => {
    expect(buildOrganizationContactFormPayload({ ...BASE_VALUES, priority: "0" }, false)).toEqual({
      error: "Prioridade deve ser um número positivo.",
    });

    const result = buildOrganizationContactFormPayload(
      {
        ...BASE_VALUES,
        contactType: "CONTRACT_INSPECTOR",
        unitId: "22222222-2222-4222-8222-222222222222",
        areaId: "33333333-3333-4333-8333-333333333333",
        contractId: "44444444-4444-4444-8444-444444444444",
        priority: "10",
      },
      true,
    );

    expect("payload" in result).toBe(true);
    if (!("payload" in result)) {
      return;
    }

    expect(result.payload).toEqual({
      organizationMemberId: BASE_VALUES.organizationMemberId,
      contactType: "CONTRACT_INSPECTOR",
      priority: 10,
      unitId: "22222222-2222-4222-8222-222222222222",
      areaId: "33333333-3333-4333-8333-333333333333",
      contractId: "44444444-4444-4444-8444-444444444444",
    });
    expect(result.payload).not.toHaveProperty("managementDepartmentId");
    expect(result.payload).not.toHaveProperty("isActive");
  });
});

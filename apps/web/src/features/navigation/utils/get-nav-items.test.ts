import { describe, expect, it } from "vitest";

import { getNavSections, getPrimaryNavItems, isStopWorkListNavActive } from "./get-nav-items";

const navParams = {
  canApproveMdho: false,
  canManageContacts: false,
  canReadReports: false,
  canCreateOccurrence: true,
} as const;

describe("isStopWorkListNavActive", () => {
  it("marca lista e detalhe, não o create", () => {
    expect(isStopWorkListNavActive("/stop-work")).toBe(true);
    expect(isStopWorkListNavActive("/stop-work/occ-1")).toBe(true);
    expect(isStopWorkListNavActive("/stop-work/new")).toBe(false);
  });
});

describe("getPrimaryNavItems stop-work active state", () => {
  const items = getPrimaryNavItems(navParams);
  const list = items.find((item) => item.key === "stop-work");
  const create = items.find((item) => item.key === "stop-work-new");

  it("em /stop-work/new só Nova Paralisação fica ativa", () => {
    expect(list?.isActive("/stop-work/new")).toBe(false);
    expect(create?.isActive("/stop-work/new")).toBe(true);
  });

  it("em lista e detalhe só Paralisações Preventivas fica ativa", () => {
    expect(list?.isActive("/stop-work")).toBe(true);
    expect(create?.isActive("/stop-work")).toBe(false);
    expect(list?.isActive("/stop-work/occ-1")).toBe(true);
    expect(create?.isActive("/stop-work/occ-1")).toBe(false);
  });
});

describe("getNavSections semântico e RBAC", () => {
  it("omite a seção Gestão se nenhuma permissão de gestão estiver ativa", () => {
    const sections = getNavSections({
      canApproveMdho: false,
      canManageContacts: false,
      canReadReports: false,
      canCreateOccurrence: true,
    });

    const keys = sections.map((s) => s.key);
    expect(keys).toEqual(["operation", "system"]);

    const operationSection = sections.find((s) => s.key === "operation");
    expect(operationSection?.items.map((item) => item.key)).toEqual([
      "dashboard",
      "stop-work",
      "stop-work-new",
    ]);

    const systemSection = sections.find((s) => s.key === "system");
    expect(systemSection?.items.map((item) => item.key)).toEqual(["notifications", "profile"]);
  });

  it("inclui a seção Gestão apenas com itens autorizados quando houver permissões parciais", () => {
    const sections = getNavSections({
      canApproveMdho: true,
      canManageContacts: false,
      canReadReports: false,
      canCreateOccurrence: false,
    });

    const keys = sections.map((s) => s.key);
    expect(keys).toEqual(["operation", "management", "system"]);

    const managementSection = sections.find((s) => s.key === "management");
    expect(managementSection?.label).toBe("Gestão");
    expect(managementSection?.items.map((item) => item.key)).toEqual(["mdho-approvals"]);

    const operationSection = sections.find((s) => s.key === "operation");
    expect(operationSection?.items.map((item) => item.key)).toEqual(["dashboard", "stop-work"]);
  });

  it("inclui todos os itens de Gestão quando todas as permissões estiverem ativas", () => {
    const sections = getNavSections({
      canApproveMdho: true,
      canManageContacts: true,
      canReadReports: true,
      canCreateOccurrence: true,
    });

    const keys = sections.map((s) => s.key);
    expect(keys).toEqual(["operation", "management", "system"]);

    const managementSection = sections.find((s) => s.key === "management");
    expect(managementSection?.items.map((item) => item.key)).toEqual([
      "mdho-approvals",
      "organization-contacts",
      "reports",
    ]);
  });
});

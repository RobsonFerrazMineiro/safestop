import { describe, expect, it } from "vitest";

import { getPrimaryNavItems, isStopWorkListNavActive } from "./get-nav-items";

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

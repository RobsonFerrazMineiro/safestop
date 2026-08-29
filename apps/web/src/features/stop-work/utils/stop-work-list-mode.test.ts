import { describe, expect, it } from "vitest";

import { parseStopWorkListViewParams } from "./dashboard-list-params";
import {
  isLegacyUnboundedStopWorkList,
  isStandardOperationalStopWorkList,
  resolveStopWorkListDataSource,
} from "./stop-work-list-mode";

function params(query: string) {
  return parseStopWorkListViewParams(new URLSearchParams(query));
}

describe("resolveStopWorkListDataSource", () => {
  it("lista padrão /stop-work usa RPC operacional", () => {
    const standard = params("");

    expect(isStandardOperationalStopWorkList(standard)).toBe(true);
    expect(resolveStopWorkListDataSource(standard)).toBe("operational-rpc");
    expect(isLegacyUnboundedStopWorkList(standard)).toBe(false);
  });

  it("dashboardFilter sem escopo especial usa RPC operacional", () => {
    expect(resolveStopWorkListDataSource(params("dashboardFilter=active"))).toBe("operational-rpc");
    expect(resolveStopWorkListDataSource(params("dashboardFilter=pending-evaluation"))).toBe(
      "operational-rpc",
    );
  });

  it("openActionPlans e dashboardScope=operational permanecem unbounded", () => {
    expect(resolveStopWorkListDataSource(params("dashboardFilter=open-action-plans"))).toBe(
      "legacy-unbounded",
    );
    expect(
      resolveStopWorkListDataSource(params("dashboardFilter=active&dashboardScope=operational")),
    ).toBe("legacy-unbounded");
  });

  it("attention permanece attention", () => {
    expect(resolveStopWorkListDataSource(params("dashboardAttention=overdue"))).toBe("attention");
  });

  it("não trata imsReferenceCode da URL como modo da lista padrão", () => {
    const withIms = params("imsReferenceCode=BAA-26-0001");

    expect(isStandardOperationalStopWorkList(withIms)).toBe(true);
    expect(resolveStopWorkListDataSource(withIms)).toBe("operational-rpc");
  });
});

import { describe, expect, it } from "vitest";

import { buildOperationalOccurrenceListQueryFilters } from "./operational-occurrence-list-query";

describe("buildOperationalOccurrenceListQueryFilters", () => {
  it("preserva filtros existentes incluindo IMS", () => {
    expect(
      buildOperationalOccurrenceListQueryFilters({
        search: "abc",
        status: ["EM_AVALIACAO"],
        severity: "HIGH",
        areaId: "area-1",
        contractorOrganizationId: "ctr-1",
        imsReferenceCode: "IMS-1",
        workspaceId: "ws-should-be-omitted",
      }),
    ).toEqual({
      search: "abc",
      status: ["EM_AVALIACAO"],
      severity: "HIGH",
      areaId: "area-1",
      contractorOrganizationId: "ctr-1",
      imsReferenceCode: "IMS-1",
      pagination: { limit: 20 },
    });
  });
});

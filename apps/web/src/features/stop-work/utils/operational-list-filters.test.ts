import { describe, expect, it } from "vitest";
import { buildListOperationalOccurrencesRpcArgs } from "@safestop/types";

import { occurrenceFiltersForDashboardFilter } from "./dashboard-list-params";
import {
  EMPTY_OPERATIONAL_LIST_UI,
  countActiveOperationalFunnelFilters,
  hasActiveOperationalDiscovery,
  toOperationalOccurrenceListFilters,
} from "./operational-list-filters";

const ORG_ID = "org-1";

describe("toOperationalOccurrenceListFilters → buildListOperationalOccurrencesRpcArgs", () => {
  it("default da lista operacional não envia p_status nem p_ims_reference_code", () => {
    const filters = toOperationalOccurrenceListFilters(EMPTY_OPERATIONAL_LIST_UI);
    const args = buildListOperationalOccurrencesRpcArgs(ORG_ID, filters);

    expect(filters.imsReferenceCode).toBeUndefined();
    expect(args.p_status).toBeNull();
    expect(args.p_severity).toBeNull();
    expect(args.p_area_id).toBeNull();
    expect(args.p_contractor_organization_id).toBeNull();
    expect(args.p_search).toBeNull();
    expect(args.p_ims_reference_code).toBeNull();
    expect(args.p_cursor).toBeNull();
    expect(args.p_limit).toBe(20);
  });

  it("status selecionado vira p_status da RPC", () => {
    const filters = toOperationalOccurrenceListFilters({
      ...EMPTY_OPERATIONAL_LIST_UI,
      status: ["EM_AVALIACAO", "VER_E_AGIR"],
    });
    const args = buildListOperationalOccurrencesRpcArgs(ORG_ID, filters);

    expect(args.p_status).toEqual(["EM_AVALIACAO", "VER_E_AGIR"]);
  });

  it("severity selecionada vira p_severity", () => {
    const filters = toOperationalOccurrenceListFilters({
      ...EMPTY_OPERATIONAL_LIST_UI,
      severity: "HIGH",
    });

    expect(buildListOperationalOccurrencesRpcArgs(ORG_ID, filters).p_severity).toEqual(["HIGH"]);
  });

  it("área e contratada vão para p_area_id e p_contractor_organization_id", () => {
    const filters = toOperationalOccurrenceListFilters({
      ...EMPTY_OPERATIONAL_LIST_UI,
      areaId: "area-1",
      contractorOrganizationId: "contractor-1",
    });
    const args = buildListOperationalOccurrencesRpcArgs(ORG_ID, filters);

    expect(args.p_area_id).toBe("area-1");
    expect(args.p_contractor_organization_id).toBe("contractor-1");
  });

  it("busca textual vai para p_search e não cria filtro dedicado IMS", () => {
    const filters = toOperationalOccurrenceListFilters({
      ...EMPTY_OPERATIONAL_LIST_UI,
      search: "  OP-IMS-123  ",
    });
    const args = buildListOperationalOccurrencesRpcArgs(ORG_ID, filters);

    expect(filters.search).toBe("OP-IMS-123");
    expect(filters.imsReferenceCode).toBeUndefined();
    expect(args.p_search).toBe("OP-IMS-123");
    expect(args.p_ims_reference_code).toBeNull();
  });

  it("troca de filtros reinicia o cursor (p_cursor null)", () => {
    const previousCursor = { sortValue: "2026-08-01 10:00:00.000000", id: "occ-1" };
    const firstPage = toOperationalOccurrenceListFilters(EMPTY_OPERATIONAL_LIST_UI, previousCursor);

    expect(buildListOperationalOccurrencesRpcArgs(ORG_ID, firstPage).p_cursor).toEqual(
      previousCursor,
    );

    const afterFunnelChange = toOperationalOccurrenceListFilters({
      ...EMPTY_OPERATIONAL_LIST_UI,
      areaId: "area-1",
    });

    expect(afterFunnelChange.pagination?.cursor).toBeNull();
    expect(buildListOperationalOccurrencesRpcArgs(ORG_ID, afterFunnelChange).p_cursor).toBeNull();
  });

  it("próxima página usa nextCursor no p_cursor", () => {
    const nextCursor = { sortValue: "2026-08-02 12:00:00.000000", id: "occ-20" };
    const filters = toOperationalOccurrenceListFilters(
      { ...EMPTY_OPERATIONAL_LIST_UI, search: "bomba" },
      nextCursor,
    );
    const args = buildListOperationalOccurrencesRpcArgs(ORG_ID, filters);

    expect(args.p_search).toBe("bomba");
    expect(args.p_cursor).toEqual(nextCursor);
  });

  it("dashboardFilter sem escopo especial deriva p_status pelo helper existente", () => {
    const args = buildListOperationalOccurrencesRpcArgs(
      ORG_ID,
      occurrenceFiltersForDashboardFilter("pending-evaluation"),
    );

    expect(args.p_status).toEqual(["PARALISACAO_PREVENTIVA", "EM_AVALIACAO"]);
    expect(args.p_ims_reference_code).toBeNull();
  });
});

describe("countActiveOperationalFunnelFilters", () => {
  it("não conta a busca textual", () => {
    expect(
      countActiveOperationalFunnelFilters({
        status: [],
        severity: null,
        areaId: null,
        contractorOrganizationId: null,
      }),
    ).toBe(0);

    expect(
      hasActiveOperationalDiscovery({
        search: "bomba",
        status: [],
        severity: null,
        areaId: null,
        contractorOrganizationId: null,
      }),
    ).toBe(true);

    expect(
      countActiveOperationalFunnelFilters({
        status: ["PARALISACAO_PREVENTIVA"],
        severity: "CRITICAL",
        areaId: "area-1",
        contractorOrganizationId: "contractor-1",
      }),
    ).toBe(4);
  });
});

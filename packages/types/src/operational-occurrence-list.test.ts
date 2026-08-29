import { describe, expect, it } from "vitest";

import {
  buildListOperationalOccurrencesRpcArgs,
  mapListOperationalOccurrencesResult,
  mapOccurrenceSummary,
  parseOperationalOccurrenceListRpcErrorCode,
} from "./operational-occurrence-list";

describe("buildListOperationalOccurrencesRpcArgs", () => {
  it("sem filtros usa defaults (limit 20, nulls, sem cursor)", () => {
    expect(buildListOperationalOccurrencesRpcArgs("org-1")).toEqual({
      p_organization_id: "org-1",
      p_search: null,
      p_area_id: null,
      p_contractor_organization_id: null,
      p_status: null,
      p_severity: null,
      p_ims_reference_code: null,
      p_cursor: null,
      p_limit: 20,
    });
  });

  it("faz trim de p_search e trata vazio/whitespace como null", () => {
    expect(buildListOperationalOccurrencesRpcArgs("org-1", { search: "  bomba  " }).p_search).toBe(
      "bomba",
    );
    expect(buildListOperationalOccurrencesRpcArgs("org-1", { search: "   " }).p_search).toBeNull();
    expect(buildListOperationalOccurrencesRpcArgs("org-1", { search: "" }).p_search).toBeNull();
  });

  it("envia severity única como array de um elemento", () => {
    expect(
      buildListOperationalOccurrencesRpcArgs("org-1", { severity: "HIGH" }).p_severity,
    ).toEqual(["HIGH"]);
  });

  it("status vazio vira null (nunca array vazio)", () => {
    expect(buildListOperationalOccurrencesRpcArgs("org-1", { status: [] }).p_status).toBeNull();
  });

  it("faz trim de imsReferenceCode", () => {
    expect(
      buildListOperationalOccurrencesRpcArgs("org-1", { imsReferenceCode: "  IMS-1  " })
        .p_ims_reference_code,
    ).toBe("IMS-1");
    expect(
      buildListOperationalOccurrencesRpcArgs("org-1", { imsReferenceCode: "  " })
        .p_ims_reference_code,
    ).toBeNull();
  });

  it("passa o cursor keyset no formato REAL { sortValue, id }", () => {
    const cursor = { sortValue: "2026-08-01 10:00:00.000000", id: "occ-1" };
    expect(
      buildListOperationalOccurrencesRpcArgs("org-1", { pagination: { cursor } }).p_cursor,
    ).toEqual(cursor);
  });

  it("cursor incompleto vira null", () => {
    expect(
      buildListOperationalOccurrencesRpcArgs("org-1", {
        pagination: { cursor: { sortValue: "", id: "occ-1" } },
      }).p_cursor,
    ).toBeNull();
  });

  it("clampa p_limit em 1–100 (default 20)", () => {
    expect(
      buildListOperationalOccurrencesRpcArgs("org-1", { pagination: { limit: 999 } }).p_limit,
    ).toBe(100);
    expect(
      buildListOperationalOccurrencesRpcArgs("org-1", { pagination: { limit: 0 } }).p_limit,
    ).toBe(1);
    expect(
      buildListOperationalOccurrencesRpcArgs("org-1", { pagination: { limit: 20 } }).p_limit,
    ).toBe(20);
  });

  it("mapeia área, contratada e status para os p_* reais", () => {
    const args = buildListOperationalOccurrencesRpcArgs("org-1", {
      areaId: "area-1",
      contractorOrganizationId: "contractor-1",
      status: ["PARALISACAO_PREVENTIVA", "EM_AVALIACAO"],
      search: "tanque",
      pagination: { limit: 50, cursor: { sortValue: "2026-08-01 10:00:00.000000", id: "occ-9" } },
    });

    expect(args).toEqual({
      p_organization_id: "org-1",
      p_search: "tanque",
      p_area_id: "area-1",
      p_contractor_organization_id: "contractor-1",
      p_status: ["PARALISACAO_PREVENTIVA", "EM_AVALIACAO"],
      p_severity: null,
      p_ims_reference_code: null,
      p_cursor: { sortValue: "2026-08-01 10:00:00.000000", id: "occ-9" },
      p_limit: 50,
    });
  });
});

describe("mapOccurrenceSummary / mapListOperationalOccurrencesResult", () => {
  const validItem = {
    id: "occ-1",
    publicCode: "PP-1",
    title: "Vazamento",
    status: "PARALISACAO_PREVENTIVA",
    severity: "HIGH",
    areaName: "Área A",
    contractorOrganizationName: "Beta",
    createdAt: "2026-08-01T10:00:00+00:00",
    createdByName: "QA Campo",
  };

  it("mapeia um item camelCase para OccurrenceSummary", () => {
    expect(mapOccurrenceSummary(validItem)).toEqual(validItem);
  });

  it("descarta item com status inválido", () => {
    expect(mapOccurrenceSummary({ ...validItem, status: "ABERTA" })).toBeNull();
  });

  it("retorna items vazio e hasNext false quando o payload é inválido", () => {
    expect(mapListOperationalOccurrencesResult(null)).toEqual({
      items: [],
      nextCursor: null,
      hasNext: false,
    });
    expect(mapListOperationalOccurrencesResult({ items: "nope" })).toEqual({
      items: [],
      nextCursor: null,
      hasNext: false,
    });
  });

  it("mapeia items, nextCursor e hasNext do jsonb real", () => {
    const result = mapListOperationalOccurrencesResult({
      items: [validItem, { ...validItem, status: "INVALID" }],
      nextCursor: { sortValue: "2026-08-01 10:00:00.000000", id: "occ-1" },
      hasNext: true,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe("occ-1");
    expect(result.hasNext).toBe(true);
    expect(result.nextCursor).toEqual({
      sortValue: "2026-08-01 10:00:00.000000",
      id: "occ-1",
    });
  });

  it("empty items com hasNext false", () => {
    expect(
      mapListOperationalOccurrencesResult({
        items: [],
        nextCursor: null,
        hasNext: false,
      }),
    ).toEqual({ items: [], nextCursor: null, hasNext: false });
  });
});

describe("parseOperationalOccurrenceListRpcErrorCode", () => {
  it("distingue FORBIDDEN de ORGANIZATION_NOT_ALLOWED no mesmo SQLSTATE 42501", () => {
    expect(
      parseOperationalOccurrenceListRpcErrorCode({
        message: "ORGANIZATION_NOT_ALLOWED",
        code: "42501",
      }),
    ).toBe("ORGANIZATION_NOT_ALLOWED");
    expect(
      parseOperationalOccurrenceListRpcErrorCode({ message: "FORBIDDEN", code: "42501" }),
    ).toBe("FORBIDDEN");
  });

  it("reconhece VALIDATION_ERROR com sufixo da mensagem SQL", () => {
    expect(
      parseOperationalOccurrenceListRpcErrorCode({
        message: "VALIDATION_ERROR: p_status contém valor inválido",
        code: "22023",
      }),
    ).toBe("VALIDATION_ERROR");
  });
});

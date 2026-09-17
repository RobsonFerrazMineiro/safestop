import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { formatOccurrenceContractorDisplay } from "@/features/occurrences/utils/format-labels";

describe("Gate 13X.2.10 — Equipe própria só sem contratada", () => {
  it("row com contractor id e name null não é Equipe própria; copia o ID", () => {
    expect(
      formatOccurrenceContractorDisplay({
        contractorOrganizationId: "org-kw",
        contractId: "ctr-1",
        contractorOrganizationName: null,
      }),
    ).toBe("org-kw");
    expect(
      formatOccurrenceContractorDisplay({
        contractorOrganizationId: "org-kw",
        contractId: "ctr-1",
        contractorOrganizationName: null,
      }),
    ).not.toBe("Equipe própria");
  });

  it("ambos NULL = Equipe própria", () => {
    expect(
      formatOccurrenceContractorDisplay({
        contractorOrganizationId: null,
        contractId: null,
        contractorOrganizationName: null,
      }),
    ).toBe("Equipe própria");
  });

  it("usa o nome quando o mapper já tiver", () => {
    expect(
      formatOccurrenceContractorDisplay({
        contractorOrganizationId: "org-kw",
        contractId: "ctr-1",
        contractorOrganizationName: "KW",
      }),
    ).toBe("KW");
  });

  it("Detail não cai no fallback name ?? Equipe própria", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/features/stop-work/components/stop-work-detail-container.tsx"),
      "utf8",
    );
    expect(source).toContain("formatOccurrenceContractorDisplay");
    expect(source).not.toContain('contractorOrganizationName ?? "Equipe própria"');
  });
});

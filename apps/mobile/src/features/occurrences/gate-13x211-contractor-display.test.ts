import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { formatOccurrenceContractorDisplay } from "@/features/occurrences/utils/occurrence-labels";

describe("Gate 13X.2.11 — Equipe própria só sem contratada", () => {
  it("id + name null não é Equipe própria; copia o ID", () => {
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
    const stopWork = readFileSync(
      resolve(process.cwd(), "src/features/stop-work/components/preventive-stop-detail-screen.tsx"),
      "utf8",
    );
    const occurrence = readFileSync(
      resolve(process.cwd(), "src/features/occurrences/components/occurrence-details-screen.tsx"),
      "utf8",
    );

    expect(stopWork).toContain("formatOccurrenceContractorDisplay");
    expect(stopWork).not.toContain('contractorOrganizationName ?? "Equipe própria"');
    expect(occurrence).toContain("formatOccurrenceContractorDisplay");
    expect(occurrence).not.toContain('contractorOrganizationName ?? "Equipe própria"');
  });
});

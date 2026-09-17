import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  buildOccurrenceEvidenceListQuery,
  isOccurrenceAttachmentListedForActingOrg,
  mapOccurrenceAttachmentRow,
  matchesCompletedInitialEvidenceUiFilter,
} from "@/features/evidence/utils/map-evidence";

const hydroCompletedInitial = {
  id: "att-1",
  occurrence_id: "occ-1",
  organization_id: "org-hydro",
  attachment_type: "INITIAL_EVIDENCE",
  original_file_name: "foto.jpg",
  mime_type: "image/jpeg",
  file_size: 1024,
  caption: null,
  upload_status: "COMPLETED",
  created_at: "2026-01-01T00:00:00.000Z",
  profiles: { full_name: "Operador" },
};

describe("Gate 13X.2.9 — evidências por occurrence_id", () => {
  it("attachment.organizationId Hydro + actingOrg TÜV ainda entra na lista", () => {
    const mapped = mapOccurrenceAttachmentRow(hydroCompletedInitial);

    expect(mapped).not.toBeNull();
    expect(mapped?.organizationId).toBe("org-hydro");
    expect(
      isOccurrenceAttachmentListedForActingOrg({
        attachmentOrganizationId: mapped!.organizationId,
        actingOrganizationId: "org-tuv",
      }),
    ).toBe(true);
    expect(matchesCompletedInitialEvidenceUiFilter(mapped!)).toBe(true);
    expect(mapped?.attachmentType).toBe("INITIAL_EVIDENCE");
    expect(mapped?.uploadStatus).toBe("COMPLETED");
  });

  it("query lista por occurrence_id e deleted_at, sem organization_id da atuante", () => {
    expect(buildOccurrenceEvidenceListQuery("occ-1")).toEqual({
      occurrenceId: "occ-1",
      deletedAt: null,
    });

    const source = readFileSync(
      resolve(process.cwd(), "src/features/evidence/services/get-occurrence-evidence.ts"),
      "utf8",
    );
    expect(source).toContain('.eq("occurrence_id", filter.occurrenceId)');
    expect(source).toContain('.is("deleted_at", filter.deletedAt)');
    expect(source).not.toMatch(/\.eq\("organization_id"/);
  });
});

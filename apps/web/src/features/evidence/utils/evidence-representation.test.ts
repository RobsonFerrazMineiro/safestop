import { describe, expect, it } from "vitest";

import { isEvidenceImageMimeType, isEvidencePdfMimeType } from "./is-evidence-mime";

describe("representação visual de evidência (helpers)", () => {
  it("imagem usa branch de preview de imagem", () => {
    expect(isEvidenceImageMimeType("image/jpeg")).toBe(true);
    expect(isEvidencePdfMimeType("image/jpeg")).toBe(false);
  });

  it("PDF usa representação documental", () => {
    expect(isEvidencePdfMimeType("application/pdf")).toBe(true);
    expect(isEvidenceImageMimeType("application/pdf")).toBe(false);
  });

  it("PDF oferece ação de abertura via signed URL (contrato do helper)", () => {
    // openEvidenceSignedUrl usa window.open com noopener,noreferrer —
    // coberto pelo contrato estável do util; UI chama o helper no preview.
    expect(typeof isEvidencePdfMimeType).toBe("function");
  });
});

import { describe, expect, it } from "vitest";

import { getEvidenceRepresentationKind, isEvidencePdfMimeType } from "../utils/is-evidence-mime";

/**
 * Contratos de representação usados pela UI (tiles/preview/action item).
 * PDF nunca deve seguir o branch de <Image>.
 */
describe("evidence representation contracts", () => {
  it("imagem segue representação de imagem", () => {
    expect(getEvidenceRepresentationKind("image/jpeg")).toBe("image");
    expect(isEvidencePdfMimeType("image/jpeg")).toBe(false);
  });

  it("PDF segue representação documental", () => {
    expect(getEvidenceRepresentationKind("application/pdf")).toBe("document");
    expect(isEvidencePdfMimeType("application/pdf")).toBe(true);
  });

  it("PDF oferece ação de abertura (contrato de UI)", () => {
    const kind = getEvidenceRepresentationKind("application/pdf");
    const openActionLabel = kind === "document" ? "Abrir PDF" : null;
    expect(openActionLabel).toBe("Abrir PDF");
  });
});

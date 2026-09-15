import { describe, expect, it } from "vitest";

import {
  getEvidenceRepresentationKind,
  isAcceptedEvidenceMimeType,
  isEvidenceImageMimeType,
  isEvidencePdfMimeType,
} from "./is-evidence-mime";

describe("is-evidence-mime", () => {
  it("aceita image/jpeg", () => {
    expect(isAcceptedEvidenceMimeType("image/jpeg")).toBe(true);
    expect(isEvidenceImageMimeType("image/jpeg")).toBe(true);
  });

  it("aceita image/png", () => {
    expect(isAcceptedEvidenceMimeType("image/png")).toBe(true);
    expect(isEvidenceImageMimeType("image/png")).toBe(true);
  });

  it("aceita image/webp", () => {
    expect(isAcceptedEvidenceMimeType("image/webp")).toBe(true);
    expect(isEvidenceImageMimeType("image/webp")).toBe(true);
  });

  it("aceita application/pdf", () => {
    expect(isAcceptedEvidenceMimeType("application/pdf")).toBe(true);
    expect(isEvidencePdfMimeType("application/pdf")).toBe(true);
  });

  it("rejeita text/plain", () => {
    expect(isAcceptedEvidenceMimeType("text/plain")).toBe(false);
    expect(isEvidenceImageMimeType("text/plain")).toBe(false);
    expect(isEvidencePdfMimeType("text/plain")).toBe(false);
  });

  it("rejeita application/octet-stream", () => {
    expect(isAcceptedEvidenceMimeType("application/octet-stream")).toBe(false);
    expect(isEvidencePdfMimeType("application/octet-stream")).toBe(false);
  });

  it("representação: imagem vs documento", () => {
    expect(getEvidenceRepresentationKind("image/jpeg")).toBe("image");
    expect(getEvidenceRepresentationKind("image/png")).toBe("image");
    expect(getEvidenceRepresentationKind("image/webp")).toBe("image");
    expect(getEvidenceRepresentationKind("application/pdf")).toBe("document");
  });
});

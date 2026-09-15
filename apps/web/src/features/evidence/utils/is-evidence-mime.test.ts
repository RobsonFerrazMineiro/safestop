import { describe, expect, it } from "vitest";

import { isAcceptedEvidenceFile } from "./is-evidence-mime";

function makeFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(Math.min(sizeBytes, 64));
  const file = new File([buffer], name, { type });
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
}

describe("isAcceptedEvidenceFile", () => {
  it("aceita JPEG", () => {
    expect(isAcceptedEvidenceFile(makeFile("a.jpg", "image/jpeg", 100))).toBe(true);
  });

  it("aceita PNG", () => {
    expect(isAcceptedEvidenceFile(makeFile("a.png", "image/png", 100))).toBe(true);
  });

  it("aceita WebP", () => {
    expect(isAcceptedEvidenceFile(makeFile("a.webp", "image/webp", 100))).toBe(true);
  });

  it("aceita PDF", () => {
    expect(isAcceptedEvidenceFile(makeFile("a.pdf", "application/pdf", 100))).toBe(true);
  });

  it("rejeita text/plain", () => {
    expect(isAcceptedEvidenceFile(makeFile("a.txt", "text/plain", 100))).toBe(false);
  });

  it("rejeita application/octet-stream", () => {
    expect(isAcceptedEvidenceFile(makeFile("a.bin", "application/octet-stream", 100))).toBe(false);
  });

  it("rejeita PDF disfarçado como octet-stream mesmo com extensão .pdf", () => {
    expect(isAcceptedEvidenceFile(makeFile("evidencia.pdf", "application/octet-stream", 100))).toBe(
      false,
    );
  });
});

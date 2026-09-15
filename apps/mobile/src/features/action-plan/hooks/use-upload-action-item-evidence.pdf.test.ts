import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("action item evidence upload coupling", () => {
  it("useUploadActionItemEvidence importa prepareEvidenceAssetForUpload e pickEvidencePdf", () => {
    const source = readFileSync(resolve(__dirname, "./use-upload-action-item-evidence.ts"), "utf8");

    expect(source).toContain("prepareEvidenceAssetForUpload");
    expect(source).toContain("pickEvidencePdf");
    expect(source).toContain("pickFromPdf");
    expect(source).toContain('return "canceled"');
    expect(source).toContain('return "uploaded"');
  });
});

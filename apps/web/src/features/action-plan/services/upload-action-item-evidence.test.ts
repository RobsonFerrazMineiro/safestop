import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Action Item reutiliza exatamente o mesmo `prepareEvidenceFileForUpload`
 * (allowlist + branch PDF vs compressão de imagem). Sem pipeline próprio.
 */
describe("upload action item evidence — pipeline compartilhado", () => {
  it("importa e chama prepareEvidenceFileForUpload do feature evidence", () => {
    const sourcePath = resolve(__dirname, "./upload-action-item-evidence.ts");
    const source = readFileSync(sourcePath, "utf8");

    expect(source).toContain(
      'import { prepareEvidenceFileForUpload } from "@/features/evidence/utils/prepare-evidence-file"',
    );
    expect(source).toContain("prepareEvidenceFileForUpload(file)");
    expect(source).not.toContain("compressImageForUpload");
  });
});

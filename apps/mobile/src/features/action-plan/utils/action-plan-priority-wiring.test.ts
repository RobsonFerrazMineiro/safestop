import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Garante que priority do card chega ao sheet sem transformação
 * e que o sheet usa requiresActionItemEvidence (MEDIUM opcional).
 */
describe("ActionPlanSubmitSheet priority wiring", () => {
  it("section passa submitItemTarget.priority ao sheet", () => {
    const section = readFileSync(
      resolve(__dirname, "../components/action-plan-section.tsx"),
      "utf8",
    );

    expect(section).toContain('priority={submitItemTarget?.priority ?? "MEDIUM"}');
  });

  it("sheet usa requiresActionItemEvidence e getActionItemEvidenceSubmitError", () => {
    const sheet = readFileSync(
      resolve(__dirname, "../components/action-plan-submit-sheet.tsx"),
      "utf8",
    );

    expect(sheet).toContain("requiresActionItemEvidence");
    expect(sheet).toContain("getActionItemEvidenceSubmitError");
    expect(sheet).not.toContain("function requiresEvidence");
  });
});

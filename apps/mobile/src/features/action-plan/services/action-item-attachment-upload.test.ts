import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Gate 13X.2.13 — upload local de evidência de action-item", () => {
  it("não usa fetch(uri); reutiliza readLocalFileBody", () => {
    const source = readFileSync(resolve(__dirname, "./action-item-attachment-upload.ts"), "utf8");

    expect(source).toContain("readLocalFileBody");
    expect(source).not.toMatch(/fetch\(\s*params\.uri\s*\)/);
    expect(source).not.toMatch(/fetch\(\s*uri\s*\)/);
  });
});

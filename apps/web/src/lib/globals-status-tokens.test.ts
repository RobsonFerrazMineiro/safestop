import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const globalsPath = path.join(webRoot, "src/app/globals.css");

describe("globals.css — emissão foundation status-*", () => {
  it("declara scan explícito e o contrato @theme status-*", () => {
    const source = fs.readFileSync(globalsPath, "utf8");

    expect(source).toContain('@source "../**/*.{ts,tsx}"');
    expect(source).toContain("--color-status-warning-bg: var(--status-warning-bg)");
    expect(source).toContain("--color-status-destructive-bg: var(--status-destructive-bg)");
    expect(source).toContain("--status-warning-bg:");
    expect(source).toContain("--status-destructive-bg:");
  });

  it("compila utilities status-* e vars via @tailwindcss/postcss", async () => {
    const tailwind = (await import("@tailwindcss/postcss")).default;
    const require = createRequire(import.meta.resolve("@tailwindcss/postcss"));
    const postcss = require("postcss") as (plugins: unknown[]) => {
      process: (css: string, opts: { from: string }) => Promise<{ css: string }>;
    };
    const input = fs.readFileSync(globalsPath, "utf8");
    const result = await postcss([tailwind()]).process(input, { from: globalsPath });
    const css = result.css;

    const required = [
      "--status-success-bg",
      "--status-warning-bg",
      "--status-destructive-bg",
      "--status-info-bg",
      "--status-primary-bg",
      "--status-muted-bg",
      "--overlay",
      ".bg-status-success-bg",
      ".bg-status-warning-bg",
      ".text-status-warning-fg",
      ".border-status-warning-border",
      ".bg-status-destructive-bg",
      ".text-status-destructive-fg",
      ".border-status-destructive-border",
      ".bg-status-info-bg",
      ".bg-status-muted-bg",
      ".bg-status-primary-bg",
      ".bg-overlay",
    ];

    for (const token of required) {
      expect(css, `CSS compilado deve conter ${token}`).toContain(token);
    }
  });
});

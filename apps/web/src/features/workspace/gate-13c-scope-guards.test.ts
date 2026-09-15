import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Gate 13C — escopo de superfície", () => {
  it("Dashboard/Reports não foram reescritos para Workspace neste Gate", () => {
    const dashboardPage = readFileSync(
      resolve(process.cwd(), "src/features/dashboard/components/dashboard-page.tsx"),
      "utf8",
    );
    const reportsHub = readFileSync(
      resolve(process.cwd(), "src/features/reports/components/reports-hub-page.tsx"),
      "utf8",
    );

    expect(dashboardPage).not.toMatch(/useActiveWorkspace|activeWorkspace/);
    expect(reportsHub).not.toMatch(/useActiveWorkspace|activeWorkspace/);
  });

  it("zero Offline / outbox / sync introduzidos no feature workspace", () => {
    const provider = readFileSync(
      resolve(process.cwd(), "src/features/workspace/provider/workspace-provider.tsx"),
      "utf8",
    );

    expect(provider).not.toMatch(/outbox|offline|sync queue|purge|replay/i);
  });
});

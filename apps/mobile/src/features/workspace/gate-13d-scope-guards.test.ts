import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const MOBILE_ROOT = join(process.cwd());

function readMobile(relativePath: string): string {
  return readFileSync(join(MOBILE_ROOT, relativePath), "utf8");
}

describe("Gate 13D — escopo e ONLINE", () => {
  it("ZERO Offline — create não grava fila/outbox/sync", () => {
    const createService = readMobile("src/features/occurrences/services/create-occurrence.ts");
    const createHook = readMobile("src/features/stop-work/hooks/use-create-preventive-stop.ts");

    expect(createService).toContain("workspace_id: workspaceId");
    expect(createService).not.toMatch(/outbox|mutation queue|replay|sync later/i);
    expect(createHook).toContain("Workspace ativo é obrigatório");
    expect(createHook).toContain("hasActiveWorkspace");
    expect(createHook).not.toMatch(/outbox|offline queue|pending mutation/i);
  });

  it("create sem Workspace bloqueia antes da RPC", () => {
    const createHook = readMobile("src/features/stop-work/hooks/use-create-preventive-stop.ts");
    expect(createHook).toContain("if (!workspaceId)");
    expect(createHook).toContain("createOccurrence({");
    expect(createHook).toContain("workspaceId,");
  });

  it("Dashboard Mobile não foi convertido para Workspace-scoped neste Gate", () => {
    const kpis = readMobile("src/features/dashboard/services/get-mobile-dashboard-kpis.ts");
    expect(kpis).not.toMatch(/p_workspace_id|activeWorkspace/);
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("ActionPlanSection — erro de items ≠ empty state", () => {
  const sectionSource = readFileSync(resolve(__dirname, "./action-plan-section.tsx"), "utf8");
  const hookSource = readFileSync(resolve(__dirname, "../hooks/use-action-plan-items.ts"), "utf8");

  it("destrói isError dos items e exibe mensagem estrutural", () => {
    expect(sectionSource).toContain("isError: isItemsError");
    expect(sectionSource).toContain("Não foi possível carregar as ações do plano.");
    expect(sectionSource).toContain("showItemsError");
    expect(sectionSource).toContain("showItemsSuccess");
  });

  it("não renderiza ActionPlanHeader enquanto items estão em erro", () => {
    // Header (0 de 0) só no ramo de sucesso
    const errorBlockIndex = sectionSource.indexOf("showItemsError");
    const successBlockIndex = sectionSource.indexOf("showItemsSuccess && plan");
    const headerInSuccess = sectionSource.indexOf("<ActionPlanHeader", successBlockIndex);

    expect(errorBlockIndex).toBeGreaterThan(-1);
    expect(successBlockIndex).toBeGreaterThan(errorBlockIndex);
    expect(headerInSuccess).toBeGreaterThan(successBlockIndex);
    expect(sectionSource.indexOf("<ActionPlanHeader", errorBlockIndex)).toBe(headerInSuccess);
  });

  it("oferece retry via refetchItems no estado de erro", () => {
    expect(sectionSource).toContain("void refetchItems()");
    expect(sectionSource).toContain("Tentar novamente");
  });

  it("hook sinaliza isError e evita tratar erro como sucesso implícito", () => {
    expect(hookSource).toContain("isError: query.isError");
    expect(hookSource).toContain("query.isError ? []");
  });
});

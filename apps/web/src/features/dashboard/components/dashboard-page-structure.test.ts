import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("DashboardPage - Estrutura e Convergência Enterprise (Gate 6)", () => {
  const dashboardSource = readFileSync(resolve(__dirname, "./dashboard-page.tsx"), "utf8");

  it("utiliza PageShell com largura wide como container raiz", () => {
    expect(dashboardSource).toContain('<PageShell width="wide"');
    expect(dashboardSource).toContain('import { PageShell } from "@/components/page-shell";');
    expect(dashboardSource).not.toContain(
      '<section className="flex w-full flex-col gap-8 px-6 py-10">',
    );
  });

  it("configura PageHeader com eyebrow 'VISÃO OPERACIONAL' e ícone LayoutDashboard", () => {
    expect(dashboardSource).toContain('eyebrow="VISÃO OPERACIONAL"');
    expect(dashboardSource).toContain('title="Dashboard"');
    expect(dashboardSource).toContain("icon={LayoutDashboard}");
  });

  it("preserva rigorosamente as cores semânticas operacionais FAMILY_COLORS", () => {
    expect(dashboardSource).toContain('IN_TREATMENT: "#F97316"');
    expect(dashboardSource).toContain('INTERDICTED: "#DC2626"');
    expect(dashboardSource).toContain('OPEN_EVALUATION: "#2563EB"');
  });

  it("utiliza grid responsivo com breakpoint intermediário para os gráficos principais", () => {
    expect(dashboardSource).toContain("md:grid-cols-1 lg:grid-cols-3");
    expect(dashboardSource).toContain("min-w-0 lg:col-span-2");
    expect(dashboardSource).toContain("min-w-0 lg:col-start-3");
  });
});

describe("DashboardKpiGrid - Harmonização dos Níveis de KPI", () => {
  const gridSource = readFileSync(resolve(__dirname, "./dashboard-kpi-grid.tsx"), "utf8");

  it("aplica estilo discreto e tracking-widest aos cabeçalhos de nível de KPI", () => {
    expect(gridSource).toContain(
      "text-xs font-bold uppercase tracking-widest text-muted-foreground/80",
    );
  });

  it("aplica espaçamento refinado gap-3 sm:gap-4 aos grids de KPI", () => {
    expect(gridSource).toContain("gap-3 sm:gap-4");
  });
});

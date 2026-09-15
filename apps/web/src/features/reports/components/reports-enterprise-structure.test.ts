import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Reports — Estrutura e Convergência Enterprise (Gate 9)", () => {
  const hubSource = readFileSync(resolve(__dirname, "./reports-hub-page.tsx"), "utf8");
  const occurrencesSource = readFileSync(
    resolve(__dirname, "./occurrences-report-page.tsx"),
    "utf8",
  );
  const actionItemsSource = readFileSync(
    resolve(__dirname, "./action-items-report-page.tsx"),
    "utf8",
  );
  const awarenessSource = readFileSync(resolve(__dirname, "./awareness-report-page.tsx"), "utf8");
  const statesSource = readFileSync(resolve(__dirname, "./report-states.tsx"), "utf8");

  it("hub e relatórios analíticos usam PageShell width='wide'", () => {
    for (const source of [hubSource, occurrencesSource, actionItemsSource, awarenessSource]) {
      expect(source).toContain('import { PageShell } from "@/components/page-shell";');
      expect(source).toContain("<PageShell");
      expect(source).toContain('width="wide"');
      expect(source).not.toContain("REPORTS_SHELL_CLASS");
    }
  });

  it("aplica os quatro eyebrows oficiais", () => {
    expect(hubSource).toContain('eyebrow="ANÁLISE GERENCIAL"');
    expect(occurrencesSource).toContain('eyebrow="RELATÓRIO DE OCORRÊNCIAS"');
    expect(actionItemsSource).toContain('eyebrow="RELATÓRIO DE PLANO DE AÇÃO"');
    expect(awarenessSource).toContain('eyebrow="RELATÓRIO DE CIÊNCIA"');
  });

  it("hub não utiliza FilterShell; relatórios analíticos utilizam", () => {
    expect(hubSource).not.toContain("FilterShell");
    expect(hubSource).not.toContain("@/components/filter-shell");

    for (const source of [occurrencesSource, actionItemsSource, awarenessSource]) {
      expect(source).toContain('import { FilterShell } from "@/components/filter-shell";');
      expect(source).toContain("<FilterShell");
      expect(source).toContain('title="Filtros e busca"');
    }
  });

  it("preserva parsers/serializers, export e summaries nos relatórios analíticos", () => {
    expect(occurrencesSource).toContain("parseOccurrenceReportViewState");
    expect(occurrencesSource).toContain("serializeOccurrenceReportViewState");
    expect(occurrencesSource).toContain("computeOccurrenceReportSummary");
    expect(occurrencesSource).toContain("exportOccurrencesReportCsv");
    expect(occurrencesSource).toContain("exportOccurrencesReportXlsx");

    expect(actionItemsSource).toContain("parseActionItemReportViewState");
    expect(actionItemsSource).toContain("serializeActionItemReportViewState");
    expect(actionItemsSource).toContain("computeActionItemReportSummary");
    expect(actionItemsSource).toContain("exportActionItemsReportCsv");
    expect(actionItemsSource).toContain("exportActionItemsReportXlsx");

    expect(awarenessSource).toContain("parseAwarenessReportViewState");
    expect(awarenessSource).toContain("serializeAwarenessReportViewState");
    expect(awarenessSource).toContain("computeAwarenessReportSummary");
    expect(awarenessSource).toContain("exportAwarenessReportCsv");
    expect(awarenessSource).toContain("exportAwarenessReportXlsx");
  });

  it("preserva RBAC report.read e estado forbidden com PageShell", () => {
    for (const source of [hubSource, occurrencesSource, actionItemsSource, awarenessSource]) {
      expect(source).toContain('can("report.read")');
      expect(source).toContain("ReportForbiddenState");
    }

    expect(statesSource).toContain('import { PageShell } from "@/components/page-shell";');
    expect(statesSource).toContain('<PageShell data-testid="report-forbidden" width="wide">');
  });

  it("hub preserva atalhos sem inventar métricas e com superfície Enterprise", () => {
    expect(hubSource).toContain('href: "/reports/occurrences"');
    expect(hubSource).toContain('href: "/reports/action-items"');
    expect(hubSource).toContain('href: "/reports/awareness"');
    expect(hubSource).toContain("bg-card/60");
    expect(hubSource).toContain("hover:border-primary/50");
    expect(hubSource).not.toContain("computeOccurrenceReportSummary");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("StopWorkListContainer - Estrutura e Convergência Enterprise (Gate 8)", () => {
  const containerSource = readFileSync(
    resolve(__dirname, "./stop-work-list-container.tsx"),
    "utf8",
  );
  const listItemSource = readFileSync(resolve(__dirname, "./stop-work-list-item.tsx"), "utf8");
  const attentionViewSource = readFileSync(
    resolve(__dirname, "./stop-work-action-attention-view.tsx"),
    "utf8",
  );

  it("utiliza PageShell width='wide' como container raiz e nos estados de acesso/erro", () => {
    expect(containerSource).toContain('import { PageShell } from "@/components/page-shell";');
    expect(containerSource).toContain('<PageShell width="wide">');
    expect(containerSource).not.toContain(
      '<section className="flex w-full flex-1 flex-col gap-6 px-6 py-10">',
    );
  });

  it("utiliza PageHeader oficial com eyebrow, icon, backHref, backLabel e CTA protegido por RBAC", () => {
    expect(containerSource).toContain('eyebrow="GESTÃO OPERACIONAL"');
    expect(containerSource).toContain('backHref="/"');
    expect(containerSource).toContain('backLabel="Dashboard"');
    expect(containerSource).toContain("icon={OctagonAlert}");
    expect(containerSource).toContain("title={pageTitle}");
    expect(containerSource).toContain('<Can permission="occurrence.create">');
    expect(containerSource).toContain('<Button asChild size="sm">');
    expect(containerSource).toContain("Nova Paralisação");
  });

  it("integra busca e filtros operacionais dentro do FilterShell no modo padrão", () => {
    expect(containerSource).toContain('import { FilterShell } from "@/components/filter-shell";');
    expect(containerSource).toContain("{isStandardOperationalList ? (");
    expect(containerSource).toContain("<FilterShell");
    expect(containerSource).toContain('title="Filtros e busca"');
    expect(containerSource).toContain("<StopWorkOperationalFiltersDialog");
    expect(containerSource).toContain("clearSearchAndFunnel");
  });

  it("preserva a máquina de URL, parâmetros, debounce e paginação infinita", () => {
    expect(containerSource).toContain("parseStopWorkListViewParams");
    expect(containerSource).toContain("useStopWorkListView");
    expect(containerSource).toContain("OPERATIONAL_LIST_SEARCH_DEBOUNCE_MS");
    expect(containerSource).toContain("toOperationalOccurrenceListFilters");
    expect(containerSource).toContain("fetchNextPage");
    expect(containerSource).toContain("hasNext");
  });

  it("harmoniza visualmente StopWorkListItem com tokens de card e destaque de código público", () => {
    expect(listItemSource).toContain("font-mono text-xs font-bold tracking-wide text-primary");
    expect(listItemSource).toContain("border-border bg-card/60");
    expect(listItemSource).toContain("hover:border-primary/50");
    expect(listItemSource).toContain("hover:bg-accent/40");
    expect(listItemSource).toContain("transition-colors");
  });

  it("harmoniza visualmente StopWorkActionAttentionView sem classes legadas gray-*", () => {
    expect(attentionViewSource).not.toContain("gray-800");
    expect(attentionViewSource).not.toContain("gray-900");
    expect(attentionViewSource).not.toContain("gray-300");
    expect(attentionViewSource).not.toContain("gray-400");
    expect(attentionViewSource).toContain("border-border bg-card/60");
    expect(attentionViewSource).toContain("hover:border-primary/50");
    expect(attentionViewSource).toContain("hover:bg-accent/40");
    expect(attentionViewSource).toContain("transition-colors");
  });
});

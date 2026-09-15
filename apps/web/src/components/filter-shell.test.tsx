import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FilterField, FilterShell } from "./filter-shell";

describe("FilterShell", () => {
  it("Caso 1 — children: renderiza os controles filhos corretamente", () => {
    const html = renderToStaticMarkup(
      <FilterShell>
        <input placeholder="Buscar ocorrência…" type="search" />
      </FilterShell>,
    );

    expect(html).toContain('placeholder="Buscar ocorrência…"');
    expect(html).not.toContain("border-b border-border/50");
  });

  it("Caso 2 — cabeçalho: renderiza title, meta e actions quando fornecidos", () => {
    const html = renderToStaticMarkup(
      <FilterShell
        actions={<button type="button">Limpar</button>}
        meta={<span>2 filtros ativos</span>}
        title="Filtros e busca"
      >
        <div>Campos de filtro</div>
      </FilterShell>,
    );

    expect(html).toContain("Filtros e busca");
    expect(html).toContain("2 filtros ativos");
    expect(html).toContain("Limpar");
    expect(html).toContain("text-xs font-bold uppercase tracking-widest text-muted-foreground/80");
    expect(html).toContain("border-b border-border/50");
  });

  it("Caso 3 — slots opcionais: não renderiza header quando title, meta e actions estão ausentes", () => {
    const html = renderToStaticMarkup(
      <FilterShell>
        <div>Sem header</div>
      </FilterShell>,
    );

    expect(html).not.toContain("border-b border-border/50");
    expect(html).toContain("Sem header");
  });

  it("Caso 4 — elemento polimórfico e classes customizadas: aceita as='div', className e contentClassName", () => {
    const html = renderToStaticMarkup(
      <FilterShell
        as="div"
        className="custom-shell-class"
        contentClassName="grid grid-cols-2 gap-4"
        title="Busca"
      >
        <div>Filho</div>
      </FilterShell>,
    );

    expect(html.startsWith("<div")).toBe(true);
    expect(html.endsWith("</div>")).toBe(true);
    expect(html).toContain("custom-shell-class");
    expect(html).toContain("grid grid-cols-2 gap-4");
  });

  it("Caso 5 — acessibilidade: adiciona aria-label quando é section", () => {
    const html = renderToStaticMarkup(
      <FilterShell title="Filtros operacionais">
        <div>Controles</div>
      </FilterShell>,
    );

    expect(html).toContain('aria-label="Filtros operacionais"');
  });
});

describe("FilterField", () => {
  it("Caso 1 — label como texto: renderiza <label> com htmlFor associado", () => {
    const html = renderToStaticMarkup(
      <FilterField htmlFor="area-select" label="Área de Trabalho">
        <select id="area-select">
          <option>Operações</option>
        </select>
      </FilterField>,
    );

    expect(html).toContain('for="area-select"');
    expect(html).toContain("Área de Trabalho");
    expect(html).toContain("<select");
    expect(html).toContain("text-xs font-medium text-muted-foreground");
  });

  it("Caso 2 — label como ReactNode e className: renderiza custom node e mescla classes", () => {
    const html = renderToStaticMarkup(
      <FilterField
        className="custom-field"
        label={<span className="custom-label">Status da Ação</span>}
      >
        <input type="checkbox" />
      </FilterField>,
    );

    expect(html).toContain("custom-label");
    expect(html).toContain("Status da Ação");
    expect(html).toContain("custom-field");
  });
});

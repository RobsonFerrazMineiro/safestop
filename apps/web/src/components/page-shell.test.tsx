import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageShell } from "./page-shell";

describe("PageShell", () => {
  it("Caso 1 — children: renderiza conteúdo filho corretamente", () => {
    const html = renderToStaticMarkup(
      <PageShell>
        <p>Conteúdo da Página Operacional</p>
      </PageShell>,
    );

    expect(html).toContain("Conteúdo da Página Operacional");
    expect(html).toContain("<p>Conteúdo da Página Operacional</p>");
  });

  it("Caso 2 — elemento padrão: renderiza como elemento <main>", () => {
    const html = renderToStaticMarkup(
      <PageShell>
        <div>Corpo principal</div>
      </PageShell>,
    );

    expect(html.startsWith("<main")).toBe(true);
    expect(html.endsWith("</main>")).toBe(true);
  });

  it("Caso 3 — elemento polimórfico: suporta as='section' e as='div'", () => {
    const sectionHtml = renderToStaticMarkup(
      <PageShell as="section">
        <div>Seção interna</div>
      </PageShell>,
    );
    expect(sectionHtml.startsWith("<section")).toBe(true);
    expect(sectionHtml.endsWith("</section>")).toBe(true);

    const divHtml = renderToStaticMarkup(
      <PageShell as="div">
        <div>Div container</div>
      </PageShell>,
    );
    expect(divHtml.startsWith("<div")).toBe(true);
    expect(divHtml.endsWith("</div>")).toBe(true);
  });

  it("Caso 4 — className: realiza mesclagem com classes customizadas", () => {
    const html = renderToStaticMarkup(
      <PageShell className="custom-test-class bg-slate-900">
        <div>Conteúdo estilizado</div>
      </PageShell>,
    );

    expect(html).toContain("custom-test-class");
    expect(html).toContain("bg-slate-900");
    // Preserva padding e flex estrutural
    expect(html).toContain("flex w-full min-w-0 flex-1 flex-col gap-6");
  });

  it("Caso 5 — width default: aplica classes de largura moderada corporativa", () => {
    const html = renderToStaticMarkup(
      <PageShell width="default">
        <div>Formulário</div>
      </PageShell>,
    );

    expect(html).toContain("max-w-5xl mx-auto");
  });

  it("Caso 6 — width wide: aplica classes para dashboards e tabelas operacionais", () => {
    const html = renderToStaticMarkup(
      <PageShell width="wide">
        <div>Dashboard e Relatórios</div>
      </PageShell>,
    );

    expect(html).toContain("max-w-7xl mx-auto");
    expect(html).not.toContain("max-w-5xl");
  });

  it("Caso 7 — width full: utiliza 100% da largura sem impor max-width restritivo", () => {
    const html = renderToStaticMarkup(
      <PageShell width="full">
        <div>Grid de tela cheia</div>
      </PageShell>,
    );

    expect(html).toContain("w-full");
    expect(html).not.toContain("max-w-5xl");
    expect(html).not.toContain("max-w-7xl");
    expect(html).not.toContain("mx-auto");
  });
});

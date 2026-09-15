import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LayoutDashboard } from "lucide-react";

import { PageHeader } from "./page-header";

describe("PageHeader", () => {
  it("Caso 1 — básico: renderiza apenas com title obrigatório", () => {
    const html = renderToStaticMarkup(<PageHeader title="Dashboard" />);

    expect(html).toContain("Dashboard");
    expect(html).toContain("<h1");
    expect(html).toContain("text-2xl font-bold tracking-tight text-foreground");
    expect(html).not.toContain("border-b");
    expect(html).not.toContain("Voltar");
  });

  it("Caso 2 — completo: renderiza eyebrow, title, subtitle e actions", () => {
    const html = renderToStaticMarkup(
      <PageHeader
        actions={<button type="button">Nova Ação</button>}
        eyebrow="GESTÃO OPERACIONAL"
        subtitle="Visão consolidada da operação industrial."
        title="Painel Executivo"
      />,
    );

    expect(html).toContain("GESTÃO OPERACIONAL");
    expect(html).toContain(
      "text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70",
    );
    expect(html).toContain("Painel Executivo");
    expect(html).toContain("Visão consolidada da operação industrial.");
    expect(html).toContain("Nova Ação");
  });

  it("Caso 3 — botão de voltar: renderiza backHref e backLabel", () => {
    const html = renderToStaticMarkup(
      <PageHeader
        backHref="/stop-work"
        backLabel="Voltar para paralisações"
        title="Detalhe da Ocorrência"
      />,
    );

    expect(html).toContain('href="/stop-work"');
    expect(html).toContain("Voltar para paralisações");
  });

  it("Caso 4 — bordered: aplica estilo estrutural de borda inferior", () => {
    const borderedHtml = renderToStaticMarkup(<PageHeader bordered title="Com Borda" />);
    expect(borderedHtml).toContain("border-b border-border/70 pb-4");

    const nonBorderedHtml = renderToStaticMarkup(<PageHeader bordered={false} title="Sem Borda" />);
    expect(nonBorderedHtml).not.toContain("border-b");
  });

  it("Caso 5 — retrocompatibilidade: sem eyebrow e sem bordered não produz elementos vazios ou divisores", () => {
    const html = renderToStaticMarkup(
      <PageHeader subtitle="Subtítulo normal" title="Título Padrão" />,
    );

    expect(html).toContain("Título Padrão");
    expect(html).toContain("Subtítulo normal");
    expect(html).not.toContain("border-b");
    expect(html).not.toContain("uppercase tracking-widest");
    expect(html).not.toContain("href=");
  });

  it("Caso 6 — ícone: renderiza o ícone via SurfaceIcon quando fornecido", () => {
    const html = renderToStaticMarkup(
      <PageHeader icon={LayoutDashboard} title="Dashboard com Ícone" />,
    );

    expect(html).toContain("Dashboard com Ícone");
    expect(html).toContain("h-6 w-6");
  });

  it("Caso 7 — subtítulo como ReactNode: renderiza elemento customizado (ex: código operacional)", () => {
    const html = renderToStaticMarkup(
      <PageHeader
        subtitle={<span className="font-mono text-primary">SS-26-000118</span>}
        title="Detalhe da Ocorrência"
      />,
    );

    expect(html).toContain("SS-26-000118");
    expect(html).toContain("font-mono text-primary");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("StopWorkDetailContainer - Estrutura e Convergência Enterprise (Gate 7)", () => {
  const containerSource = readFileSync(
    resolve(__dirname, "./stop-work-detail-container.tsx"),
    "utf8",
  );

  it("utiliza PageShell width='default' como container raiz", () => {
    expect(containerSource).toContain('<PageShell width="default">');
    expect(containerSource).toContain('import { PageShell } from "@/components/page-shell";');
    expect(containerSource).not.toContain(
      '<main className="flex min-h-screen w-full flex-col gap-6 px-6 py-10">',
    );
  });

  it("utiliza PageHeader oficial com eyebrow, icon, backHref e subtitle com código operacional", () => {
    expect(containerSource).toContain('eyebrow="FICHA TÉCNICA DA OCORRÊNCIA"');
    expect(containerSource).toContain('backHref="/stop-work"');
    expect(containerSource).toContain('backLabel="Paralisações"');
    expect(containerSource).toContain("icon={FileText}");
    expect(containerSource).toContain("bordered");
    expect(containerSource).toContain("font-mono font-bold tracking-wide text-primary");
    expect(containerSource).toContain("{stopWork.publicCode}");
  });

  it("renderiza badges de status e severidade nas actions do PageHeader", () => {
    expect(containerSource).toContain("<StatusBadge status={stopWork.status} />");
    expect(containerSource).toContain("<StatusBadge severity={stopWork.severity} />");
    expect(containerSource).toContain('stopWork.status === "INTERDICAO_CONFIRMADA"');
    expect(containerSource).toContain("Interdição Oficial");
  });

  it("aplica PageShell também no estado 'Paralisação não encontrada'", () => {
    const notFoundIndex = containerSource.indexOf("Paralisação não encontrada");
    expect(notFoundIndex).toBeGreaterThan(-1);
    expect(containerSource).toContain('title="Paralisação não encontrada"');
  });

  it("harmoniza títulos das seções com o padrão Enterprise uppercase discreto", () => {
    expect(containerSource).toContain(
      "text-xs font-bold uppercase tracking-widest text-muted-foreground/80",
    );
  });
});

import { describe, expect, it } from "vitest";

import { buildCsvBlob, escapeCsvCell, formatCsvDate } from "./csv";

describe("escapeCsvCell — mitigação de CSV injection (PO-REP-2)", () => {
  it.each([
    ["=SOMA(A1:A10)", "'=SOMA(A1:A10)"],
    ["+1+1", "'+1+1"],
    ["-2+3", "'-2+3"],
    ["@SUM(1+1)", "'@SUM(1+1)"],
    ["=cmd|' /C calc'!A1", "'=cmd|' /C calc'!A1"],
  ])("prefixa valor malicioso %s com aspas simples", (raw, expected) => {
    expect(escapeCsvCell(raw)).toBe(expected);
  });

  it("não altera valores normais (sem caracteres de risco)", () => {
    expect(escapeCsvCell("REP-OC-000123")).toBe("REP-OC-000123");
    expect(escapeCsvCell("Fulano de Tal")).toBe("Fulano de Tal");
  });

  it("aplica quoting CSV para valores com delimitador `;`", () => {
    expect(escapeCsvCell("Contrato 123; Nome")).toBe('"Contrato 123; Nome"');
  });

  it("aplica quoting CSV e escapa aspas duplas internas", () => {
    expect(escapeCsvCell('Motivo: "falso alarme"')).toBe('"Motivo: ""falso alarme"""');
  });

  it("combina prefixo anti-injection com quoting quando a célula também contém `;`", () => {
    expect(escapeCsvCell("=A1;B1")).toBe('"\'=A1;B1"');
  });
});

describe("formatCsvDate — datas no formato dd/MM/yyyy", () => {
  it("formata timestamp ISO para dd/MM/yyyy", () => {
    expect(formatCsvDate("2026-01-05T10:30:00.000Z")).toMatch(/^\d{2}\/\d{2}\/2026$/);
  });

  it("retorna string vazia para null", () => {
    expect(formatCsvDate(null)).toBe("");
  });

  it("retorna string vazia para data inválida", () => {
    expect(formatCsvDate("não-é-uma-data")).toBe("");
  });
});

describe("buildCsvBlob — BOM UTF-8 e delimitador `;`", () => {
  it("gera Blob CSV com BOM UTF-8 e conteúdo delimitado por `;`", async () => {
    const blob = buildCsvBlob(["Código", "Área"], [["REP-1", "Área Norte"]]);

    expect(blob.type).toBe("text/csv;charset=utf-8;");

    // `Blob.text()` usa TextDecoder, que remove o BOM por padrão ao decodificar
    // (spec WHATWG) — por isso a verificação do BOM lê os bytes brutos.
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);

    const text = await blob.text();
    expect(text).toContain("Código;Área");
    expect(text).toContain("REP-1;Área Norte");
  });
});

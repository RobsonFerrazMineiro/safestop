import { describe, expect, it } from "vitest";

import { buildXlsxBlob } from "./xlsx";

type FakeRow = { code: string; occurredAt: Date };

describe("buildXlsxBlob — geração real via write-excel-file/universal", () => {
  it("gera um Blob .xlsx válido e não vazio a partir de linhas + colunas", async () => {
    const rows: FakeRow[] = [
      { code: "REP-1", occurredAt: new Date("2026-01-05T10:00:00.000Z") },
      { code: "REP-2", occurredAt: new Date("2026-02-10T10:00:00.000Z") },
    ];

    const blob = await buildXlsxBlob(rows, [
      { header: "Código", cell: (row) => ({ value: row.code }) },
      {
        header: "Data",
        cell: (row) => ({ value: row.occurredAt, type: Date, format: "dd/mm/yyyy" }),
      },
    ]);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);

    // Um .xlsx é um .zip válido — assinatura local file header "PK\x03\x04".
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2], bytes[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it("gera um Blob válido mesmo com zero linhas (apenas cabeçalho)", async () => {
    const blob = await buildXlsxBlob<FakeRow>(
      [],
      [{ header: "Código", cell: (row) => ({ value: row.code }) }],
    );

    expect(blob.size).toBeGreaterThan(0);
  });
});

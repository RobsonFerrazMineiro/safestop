import { describe, expect, it } from "vitest";

import type { ReportCursor } from "@safestop/types";

import { fetchAllReportRows, ReportExportLimitExceededError } from "./fetch-all-report-rows";

type FakeRow = { id: string };

function buildFakePages(totalRows: number, pageSize: number) {
  const rows: FakeRow[] = Array.from({ length: totalRows }, (_, index) => ({
    id: `row-${index}`,
  }));

  return async (pagination: { cursor?: ReportCursor | null; limit?: number }) => {
    const offset = pagination.cursor ? Number(pagination.cursor.sortValue) : 0;
    const limit = pagination.limit ?? pageSize;
    const page = rows.slice(offset, offset + limit);
    const nextOffset = offset + page.length;
    const hasNext = nextOffset < rows.length;

    return {
      items: page,
      hasNext,
      nextCursor: hasNext ? { sortValue: String(nextOffset), id: `row-${nextOffset}` } : null,
    };
  };
}

describe("fetchAllReportRows — exportação completa via cursor (PO-REP-2)", () => {
  it("percorre todas as páginas até esgotar o cursor, sem duplicar nem perder linhas", async () => {
    const fetchPage = buildFakePages(7, 3);

    const rows = await fetchAllReportRows(fetchPage);

    expect(rows).toHaveLength(7);
    expect(rows.map((row) => row.id)).toEqual([
      "row-0",
      "row-1",
      "row-2",
      "row-3",
      "row-4",
      "row-5",
      "row-6",
    ]);
  });

  it("lança ReportExportLimitExceededError quando o total excede o limite informado", async () => {
    const fetchPage = buildFakePages(12, 5);

    await expect(fetchAllReportRows(fetchPage, 10)).rejects.toThrow(ReportExportLimitExceededError);
  });

  it("não lança erro quando o total é EXATAMENTE igual ao limite (não é excedente)", async () => {
    const fetchPage = buildFakePages(10, 5);

    const rows = await fetchAllReportRows(fetchPage, 10);
    expect(rows).toHaveLength(10);
  });

  it("mensagem de erro orienta refinar filtros — nunca expõe detalhe técnico", async () => {
    const fetchPage = buildFakePages(6, 5);

    try {
      await fetchAllReportRows(fetchPage, 5);
      throw new Error("deveria ter lançado ReportExportLimitExceededError");
    } catch (error) {
      expect(error).toBeInstanceOf(ReportExportLimitExceededError);
      expect((error as Error).message).toContain("Refine os filtros");
    }
  });
});

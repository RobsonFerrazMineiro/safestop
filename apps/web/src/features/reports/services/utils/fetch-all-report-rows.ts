import type { ReportCursor, ReportPagination } from "@safestop/types";
import { REPORT_EXPORT_MAX_ROWS, REPORT_PAGINATION_MAX_LIMIT } from "@safestop/types";

/**
 * Exportação usa o resultado filtrado COMPLETO (não apenas a página atual) —
 * percorre todas as páginas via cursor até esgotar ou até exceder o limite
 * de exportação (PO-REP-2, 10.000 linhas). Acima do limite, erro tratado
 * orientando refinar filtros — nunca exporta um recorte parcial silencioso.
 */
export class ReportExportLimitExceededError extends Error {
  constructor(maxRows: number = REPORT_EXPORT_MAX_ROWS) {
    super(
      `O relatório excede o limite de ${maxRows.toLocaleString("pt-BR")} linhas para exportação. Refine os filtros e tente novamente.`,
    );
    this.name = "ReportExportLimitExceededError";
  }
}

export type ReportPage<TRow> = {
  items: TRow[];
  nextCursor: ReportCursor | null;
  hasNext: boolean;
};

export type ReportPageFetcher<TRow> = (pagination: ReportPagination) => Promise<ReportPage<TRow>>;

export async function fetchAllReportRows<TRow>(
  fetchPage: ReportPageFetcher<TRow>,
  maxRows: number = REPORT_EXPORT_MAX_ROWS,
): Promise<TRow[]> {
  const rows: TRow[] = [];
  let cursor: ReportCursor | null = null;

  while (true) {
    const page = await fetchPage({ cursor, limit: REPORT_PAGINATION_MAX_LIMIT });
    rows.push(...page.items);

    if (rows.length > maxRows) {
      throw new ReportExportLimitExceededError(maxRows);
    }

    if (!page.hasNext || !page.nextCursor) {
      break;
    }

    cursor = page.nextCursor;
  }

  return rows;
}

import { describe, expect, it } from "vitest";

import { REPORT_COPY } from "./report-copy";

describe("REPORT_COPY", () => {
  it("preserva o contrato de copy usado pelo Web e E2E", () => {
    expect(REPORT_COPY).toEqual({
      hubTitle: "Relatórios",
      occurrences: "Ocorrências",
      actionItems: "Plano de Ação",
      awareness: "Ciência",
      export: "Exportar",
      exportCsv: "Exportar CSV",
      exportXlsx: "Exportar XLSX",
      exportLoading: "Gerando arquivo…",
      filters: "Filtros",
      clearFilters: "Limpar filtros",
      showOptionalColumns: "Mostrar colunas opcionais",
      periodHint: "O período filtra os registros deste relatório",
      onThisPage: "Nesta página",
      hasMore: "Há mais resultados",
      endOfResults: "Fim dos resultados",
      empty: "Nenhum registro no sistema.",
      noResults: "Nenhum registro corresponde aos filtros selecionados.",
      forbidden: "Você não tem permissão para visualizar relatórios.",
      loadError: "Não foi possível carregar o relatório.",
      exportError: "Não foi possível exportar.",
      retry: "Tentar novamente",
      awarenessReadHint: "Leitura não é confirmação de ciência",
      searchByCode: "Buscar por código",
    });
  });
});

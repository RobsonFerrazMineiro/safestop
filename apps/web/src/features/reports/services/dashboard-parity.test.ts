import type { OccurrenceReportRow } from "@safestop/types";
import { computeOccurrenceReportSummary } from "@safestop/types";
import { describe, expect, it } from "vitest";

import { computeScopedManagerialOccurrenceKpis } from "@/features/dashboard/utils/compute-scoped-occurrence-kpis";
import { filterByDashboardScope } from "@/features/dashboard/utils/matches-scope-filters";

import type { DashboardScopeOccurrenceRow } from "../../dashboard/types/scope-filters";

/**
 * Teste de paridade Dashboard × Reports para "interdições ativas"
 * (correção Gate G, docs/decisions/REPORTS-DECISIONS.md — adendo
 * "Correção Gate G"). Usa as funções reais de produção dos dois lados
 * (não reimplementa fórmula): `filterByDashboardScope` +
 * `computeScopedManagerialOccurrenceKpis` (Dashboard) e
 * `computeOccurrenceReportSummary` (Reports).
 *
 * Dataset fixo: 10 ocorrências, 3 áreas (A/B/C), espelhando o cenário do QA
 * Gate G. Inclui uma interdição ativa FORA da área filtrada (área B), que
 * deve ser excluída dos dois lados.
 */

const AREA_A = "area-a";
const AREA_B = "area-b";
const AREA_C = "area-c";

type Fixture = {
  id: string;
  status: OccurrenceReportRow["status"];
  areaId: string;
  occurredAt: string;
  createdAt: string;
};

const FIXTURES: Fixture[] = [
  // Área A — 5 ocorrências, 2 interdições ativas.
  // Fixture "1" tem occurredAt antigo (fora de uma janela de 30 dias a
  // partir de 2026-08-01) — usado no teste 3 para demonstrar a divergência
  // legítima quando o Reports aplica filtro de período.
  {
    id: "1",
    status: "INTERDICAO_CONFIRMADA",
    areaId: AREA_A,
    occurredAt: "2026-06-01T10:00:00Z",
    createdAt: "2026-06-01T10:00:00Z",
  },
  {
    id: "2",
    status: "EM_TRATATIVA",
    areaId: AREA_A,
    occurredAt: "2026-08-05T10:00:00Z",
    createdAt: "2026-08-05T10:00:00Z",
  },
  {
    id: "3",
    status: "PARALISACAO_PREVENTIVA",
    areaId: AREA_A,
    occurredAt: "2026-08-10T10:00:00Z",
    createdAt: "2026-08-10T10:00:00Z",
  },
  {
    id: "4",
    status: "ENCERRADA",
    areaId: AREA_A,
    occurredAt: "2026-01-10T10:00:00Z",
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "5",
    status: "CANCELADA",
    areaId: AREA_A,
    occurredAt: "2026-08-15T10:00:00Z",
    createdAt: "2026-08-15T10:00:00Z",
  },
  // Área B — 3 ocorrências, 1 interdição ativa (deve ficar de fora do filtro Área A).
  {
    id: "6",
    status: "AGUARDANDO_APROVACAO_HSE",
    areaId: AREA_B,
    occurredAt: "2026-08-02T10:00:00Z",
    createdAt: "2026-08-02T10:00:00Z",
  },
  {
    id: "7",
    status: "PARALISACAO_PREVENTIVA",
    areaId: AREA_B,
    occurredAt: "2026-08-06T10:00:00Z",
    createdAt: "2026-08-06T10:00:00Z",
  },
  {
    id: "8",
    status: "ENCERRADA",
    areaId: AREA_B,
    occurredAt: "2026-08-09T10:00:00Z",
    createdAt: "2026-08-09T10:00:00Z",
  },
  // Área C — 2 ocorrências, nenhuma interdição ativa.
  {
    id: "9",
    status: "PARALISACAO_PREVENTIVA",
    areaId: AREA_C,
    occurredAt: "2026-08-03T10:00:00Z",
    createdAt: "2026-08-03T10:00:00Z",
  },
  {
    id: "10",
    status: "ENCERRADA",
    areaId: AREA_C,
    occurredAt: "2026-08-12T10:00:00Z",
    createdAt: "2026-08-12T10:00:00Z",
  },
];

function toDashboardScopeRow(fixture: Fixture): DashboardScopeOccurrenceRow {
  return {
    id: fixture.id,
    status: fixture.status,
    areaId: fixture.areaId,
    areaName: null,
    contractId: null,
    contractorOrganizationId: null,
    contractorOrganizationName: null,
    createdAt: fixture.createdAt,
  };
}

function toOccurrenceReportRow(fixture: Fixture): OccurrenceReportRow {
  return {
    id: fixture.id,
    publicCode: `PP-${fixture.id}`,
    occurredAt: fixture.occurredAt,
    areaId: fixture.areaId,
    areaName: null,
    contractId: null,
    contractNumber: null,
    contractName: null,
    contractorOrganizationId: null,
    contractorOrganizationName: null,
    status: fixture.status,
    statusFamily: "OPEN_EVALUATION",
    severity: "MEDIUM",
    decisionType: null,
    imsReferenceCode: null,
    unitId: null,
    unitName: null,
    managementDepartmentId: null,
    managementDepartmentName: null,
    stoppedAt: null,
    evaluatedAt: null,
    releasedAt: null,
    closedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdByName: null,
    assignedEvaluatorName: null,
  };
}

describe("paridade Dashboard x Reports — activeInterdictions (Gate G)", () => {
  it("retorna a mesma contagem quando escopo é igual, sem período e sobre o conjunto completo", () => {
    const scopeFilters = { areaId: AREA_A, contractId: null, contractorOrganizationId: null };

    // Lado Dashboard: recompute client-side sobre o conjunto completo acessível, sem período.
    const dashboardRows = FIXTURES.map(toDashboardScopeRow);
    const dashboardScoped = filterByDashboardScope(dashboardRows, scopeFilters);
    const dashboardSummary = computeScopedManagerialOccurrenceKpis(dashboardScoped, null);

    // Lado Reports: simula o que list_occurrences_report retornaria com
    // p_area_id = AREA_A e SEM p_period_start/p_period_end (condição de
    // paridade válida — ver adendo Gate G).
    const reportRowsFilteredByArea = FIXTURES.filter((f) => f.areaId === AREA_A).map(
      toOccurrenceReportRow,
    );
    const reportSummary = computeOccurrenceReportSummary(reportRowsFilteredByArea);

    expect(dashboardSummary.activeInterdictions).toBe(2);
    expect(reportSummary.activeInterdictionsCount).toBe(2);
    expect(reportSummary.activeInterdictionsCount).toBe(dashboardSummary.activeInterdictions);
  });

  it("exclui a interdição ativa fora da área filtrada dos dois lados", () => {
    const scopeFilters = { areaId: AREA_A, contractId: null, contractorOrganizationId: null };

    const dashboardRows = FIXTURES.map(toDashboardScopeRow);
    const dashboardScoped = filterByDashboardScope(dashboardRows, scopeFilters);
    const dashboardSummary = computeScopedManagerialOccurrenceKpis(dashboardScoped, null);

    const reportRowsFilteredByArea = FIXTURES.filter((f) => f.areaId === AREA_A).map(
      toOccurrenceReportRow,
    );
    const reportSummary = computeOccurrenceReportSummary(reportRowsFilteredByArea);

    // Ocorrência "6" (área B, AGUARDANDO_APROVACAO_HSE — interdição ativa)
    // não pode contar em nenhum dos dois lados quando o filtro é área A.
    const outsideAreaIncludedInDashboard = dashboardScoped.some((row) => row.id === "6");
    const outsideAreaIncludedInReport = reportRowsFilteredByArea.some((row) => row.id === "6");

    expect(outsideAreaIncludedInDashboard).toBe(false);
    expect(outsideAreaIncludedInReport).toBe(false);
    expect(dashboardSummary.activeInterdictions).toBe(2);
    expect(reportSummary.activeInterdictionsCount).toBe(2);
  });

  it("diverge legitimamente quando o Reports aplica filtro de período (condição de paridade não atendida)", () => {
    const scopeFilters = { areaId: AREA_A, contractId: null, contractorOrganizationId: null };

    // Dashboard: estoque nunca filtra por período — conta as 2 interdições
    // ativas da área A (fixtures "1" e "2"), independentemente de occurredAt.
    const dashboardRows = FIXTURES.map(toDashboardScopeRow);
    const dashboardScoped = filterByDashboardScope(dashboardRows, scopeFilters);
    const dashboardSummary = computeScopedManagerialOccurrenceKpis(dashboardScoped, null);
    expect(dashboardSummary.activeInterdictions).toBe(2);

    // Reports: mesmo filtro de área, mas com período de "últimos 30 dias"
    // a partir de 2026-08-01 — a interdição "1" (occurredAt em junho) sai
    // do resultado. Isso é o mesmo mecanismo do achado do QA Gate G: a
    // divergência não é um bug de contagem, é a semântica documentada de
    // período do Reports (REP-C12) aplicada a uma métrica de estoque.
    const periodStart = new Date("2026-08-01T00:00:00Z");
    const reportRowsWithPeriod = FIXTURES.filter(
      (f) => f.areaId === AREA_A && new Date(f.occurredAt) >= periodStart,
    ).map(toOccurrenceReportRow);
    const reportSummaryWithPeriod = computeOccurrenceReportSummary(reportRowsWithPeriod);

    expect(reportRowsWithPeriod.length).toBeLessThan(
      FIXTURES.filter((f) => f.areaId === AREA_A).length,
    );
    expect(reportSummaryWithPeriod.activeInterdictionsCount).toBe(1);
    expect(reportSummaryWithPeriod.activeInterdictionsCount).not.toBe(
      dashboardSummary.activeInterdictions,
    );
  });
});

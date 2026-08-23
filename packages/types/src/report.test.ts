import { describe, expect, it } from "vitest";

import { isDueSoonActionItem, isOverdueActionItem } from "./dashboard-formulas";
import type { ActionItemReportRow } from "./report";
import {
  buildListActionItemsReportRpcArgs,
  buildListAwarenessReportRpcArgs,
  buildListOccurrencesReportRpcArgs,
  computeActionItemReportSummary,
  parseReportRpcErrorCode,
} from "./report";

describe("mapeamento de filtros da UI → parâmetros de RPC", () => {
  it("list_occurrences_report: mapeia todos os filtros e aplica defaults de sort/paginação", () => {
    const args = buildListOccurrencesReportRpcArgs(
      "org-1",
      {
        period: { startAt: "2026-01-01T00:00:00.000Z", endAt: "2026-01-31T23:59:59.999Z" },
        areaId: "area-1",
        contractId: "contract-1",
        contractorOrganizationId: "contractor-1",
        status: ["PARALISACAO_PREVENTIVA", "EM_AVALIACAO"],
        severity: ["HIGH", "CRITICAL"],
        hasIms: true,
        search: "  REP-OC-1  ",
      },
      { field: "public_code", direction: "asc" },
      { limit: 50 },
    );

    expect(args).toEqual({
      p_organization_id: "org-1",
      p_period_start: "2026-01-01T00:00:00.000Z",
      p_period_end: "2026-01-31T23:59:59.999Z",
      p_area_id: "area-1",
      p_contract_id: "contract-1",
      p_contractor_organization_id: "contractor-1",
      p_status: ["PARALISACAO_PREVENTIVA", "EM_AVALIACAO"],
      p_severity: ["HIGH", "CRITICAL"],
      p_has_ims: true,
      p_search: "REP-OC-1",
      p_sort_field: "public_code",
      p_sort_direction: "asc",
      p_cursor: null,
      p_limit: 50,
    });
  });

  it("list_occurrences_report: sem filtros usa defaults (sort occurred_at/desc, limit 20, nulls)", () => {
    const args = buildListOccurrencesReportRpcArgs("org-1");

    expect(args).toEqual({
      p_organization_id: "org-1",
      p_period_start: null,
      p_period_end: null,
      p_area_id: null,
      p_contract_id: null,
      p_contractor_organization_id: null,
      p_status: null,
      p_severity: null,
      p_has_ims: null,
      p_search: null,
      p_sort_field: "occurred_at",
      p_sort_direction: "desc",
      p_cursor: null,
      p_limit: 20,
    });
  });

  it("list_occurrences_report: p_limit nunca excede REPORT_PAGINATION_MAX_LIMIT (100)", () => {
    const args = buildListOccurrencesReportRpcArgs("org-1", {}, undefined, { limit: 999 });
    expect(args.p_limit).toBe(100);
  });

  it("list_occurrences_report: p_limit nunca fica abaixo de 1", () => {
    const args = buildListOccurrencesReportRpcArgs("org-1", {}, undefined, { limit: 0 });
    expect(args.p_limit).toBe(1);
  });

  it("list_action_items_report: mapeia filtros de plano de ação, incluindo clamp de dueSoonDays (1–30)", () => {
    const args = buildListActionItemsReportRpcArgs(
      "org-1",
      {
        responsibleMemberId: "member-1",
        status: ["PENDING", "IN_PROGRESS"],
        overdueOnly: true,
        dueSoonOnly: false,
        dueSoonDays: 90,
      },
      { field: "status", direction: "desc" },
      { cursor: { sortValue: "2026-01-01", id: "row-1" } },
    );

    expect(args).toEqual({
      p_organization_id: "org-1",
      p_period_start: null,
      p_period_end: null,
      p_responsible_member_id: "member-1",
      p_status: ["PENDING", "IN_PROGRESS"],
      p_overdue_only: true,
      p_due_soon_only: false,
      p_due_soon_days: 30,
      p_sort_field: "status",
      p_sort_direction: "desc",
      p_cursor: { sortValue: "2026-01-01", id: "row-1" },
      p_limit: 20,
    });
  });

  it("list_awareness_report: mapeia filtros de ciência", () => {
    const args = buildListAwarenessReportRpcArgs("org-1", {
      occurrenceId: "occ-1",
      recipientMemberId: "member-2",
      pendingOnly: true,
    });

    expect(args).toEqual({
      p_organization_id: "org-1",
      p_period_start: null,
      p_period_end: null,
      p_occurrence_id: "occ-1",
      p_recipient_member_id: "member-2",
      p_pending_only: true,
      p_sort_field: "created_at",
      p_sort_direction: "desc",
      p_cursor: null,
      p_limit: 20,
    });
  });

  it("status/severity vazios são normalizados para null (nunca array vazio)", () => {
    const args = buildListOccurrencesReportRpcArgs("org-1", { status: [], severity: [] });
    expect(args.p_status).toBeNull();
    expect(args.p_severity).toBeNull();
  });
});

describe("erros de RPC — distinção PERMISSION_DENIED vs ORGANIZATION_NOT_ALLOWED", () => {
  it("reconhece ORGANIZATION_NOT_ALLOWED mesmo com SQLSTATE 42501 (igual a PERMISSION_DENIED)", () => {
    expect(parseReportRpcErrorCode({ message: "ORGANIZATION_NOT_ALLOWED", code: "42501" })).toBe(
      "ORGANIZATION_NOT_ALLOWED",
    );
  });

  it("reconhece PERMISSION_DENIED mesmo com o mesmo SQLSTATE 42501", () => {
    expect(parseReportRpcErrorCode({ message: "PERMISSION_DENIED", code: "42501" })).toBe(
      "PERMISSION_DENIED",
    );
  });

  it("erro desconhecido cai em UNKNOWN — nunca expõe detalhe técnico ao usuário", () => {
    expect(
      parseReportRpcErrorCode({ message: "duplicate key value violates unique constraint" }),
    ).toBe("UNKNOWN");
  });
});

describe("paridade numérica com o Dashboard 3.2 (Plano de Ação)", () => {
  const now = new Date("2026-08-22T12:00:00.000Z");

  function makeRow(overrides: Partial<ActionItemReportRow>): ActionItemReportRow {
    return {
      id: "item-1",
      occurrenceId: "occ-1",
      actionPlanId: "plan-1",
      title: "Ação de teste",
      responsibleMemberId: "member-1",
      responsibleMemberName: "Fulano de Tal",
      dueAt: now.toISOString(),
      status: "PENDING",
      completedAt: null,
      validatedAt: null,
      isOverdue: false,
      isDueSoon: false,
      ...overrides,
    };
  }

  it("computeActionItemReportSummary reconta overdue/dueSoon com a MESMA fórmula do Dashboard 3.2", () => {
    const rows: ActionItemReportRow[] = [
      // vencida — due_at no passado, status aberto (mesma fórmula server-side).
      makeRow({
        id: "overdue-1",
        dueAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "PENDING",
        isOverdue: true,
        isDueSoon: false,
      }),
      // próxima do vencimento — due_at dentro dos próximos 3 dias (default).
      makeRow({
        id: "due-soon-1",
        dueAt: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "IN_PROGRESS",
        isOverdue: false,
        isDueSoon: true,
      }),
      // concluída no passado — nunca conta como vencida (item fechado).
      makeRow({
        id: "completed-1",
        dueAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "COMPLETED",
        completedAt: now.toISOString(),
        isOverdue: false,
        isDueSoon: false,
      }),
      // futura, fora da janela de "próxima do vencimento".
      makeRow({
        id: "future-1",
        dueAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: "PENDING",
        isOverdue: false,
        isDueSoon: false,
      }),
    ];

    const summary = computeActionItemReportSummary(rows, now);

    expect(summary).toEqual({ totalRows: 4, overdueCount: 1, dueSoonCount: 1 });

    // Paridade linha a linha: o flag calculado pela RPC (row.isOverdue/isDueSoon)
    // deve bater EXATAMENTE com a fórmula client-side reaproveitada de
    // dashboard-formulas.ts — nenhuma divergência de fórmula entre camadas.
    for (const row of rows) {
      expect(isOverdueActionItem({ status: row.status, dueAt: row.dueAt, now })).toBe(
        row.isOverdue,
      );
      expect(isDueSoonActionItem({ status: row.status, dueAt: row.dueAt, now })).toBe(
        row.isDueSoon,
      );
    }
  });
});

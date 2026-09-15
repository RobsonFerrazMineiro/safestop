import { describe, expect, it } from "vitest";

import {
  DASHBOARD_ATTENTION,
  DASHBOARD_ATTENTION_SCOPE,
  parseDashboardAttention,
  parseDashboardAttentionScope,
  stopWorkAttentionEmptyMessage,
  stopWorkAttentionSubtitle,
  stopWorkAttentionTitle,
} from "./dashboard-list-params";

describe("parseDashboardAttentionScope", () => {
  it("ausente → organization", () => {
    expect(parseDashboardAttentionScope(undefined)).toBe(DASHBOARD_ATTENTION_SCOPE.organization);
  });

  it("inválido → organization", () => {
    expect(parseDashboardAttentionScope("personal")).toBe(DASHBOARD_ATTENTION_SCOPE.organization);
    expect(parseDashboardAttentionScope("")).toBe(DASHBOARD_ATTENTION_SCOPE.organization);
  });

  it("mine → mine", () => {
    expect(parseDashboardAttentionScope("mine")).toBe(DASHBOARD_ATTENTION_SCOPE.mine);
  });
});

describe("parseDashboardAttention", () => {
  it("reconhece pending, overdue e due-soon", () => {
    expect(parseDashboardAttention("pending")).toBe(DASHBOARD_ATTENTION.pending);
    expect(parseDashboardAttention("overdue")).toBe(DASHBOARD_ATTENTION.overdue);
    expect(parseDashboardAttention("due-soon")).toBe(DASHBOARD_ATTENTION.dueSoon);
  });

  it("rejeita valor inválido", () => {
    expect(parseDashboardAttention("all")).toBeNull();
    expect(parseDashboardAttention("PENDING")).toBeNull();
  });
});

describe("stopWorkAttention copy — pessoal", () => {
  it("mine + pending", () => {
    expect(
      stopWorkAttentionTitle(DASHBOARD_ATTENTION.pending, DASHBOARD_ATTENTION_SCOPE.mine),
    ).toBe("Minhas ações pendentes");
    expect(
      stopWorkAttentionSubtitle(DASHBOARD_ATTENTION.pending, DASHBOARD_ATTENTION_SCOPE.mine),
    ).toBe("Ações sob sua responsabilidade que ainda estão pendentes ou em andamento.");
    expect(
      stopWorkAttentionEmptyMessage(DASHBOARD_ATTENTION.pending, DASHBOARD_ATTENTION_SCOPE.mine),
    ).toBe("Você não possui ações pendentes.");
  });

  it("mine + overdue", () => {
    expect(
      stopWorkAttentionTitle(DASHBOARD_ATTENTION.overdue, DASHBOARD_ATTENTION_SCOPE.mine),
    ).toBe("Minhas ações vencidas");
    expect(
      stopWorkAttentionSubtitle(DASHBOARD_ATTENTION.overdue, DASHBOARD_ATTENTION_SCOPE.mine),
    ).toBe("Ações sob sua responsabilidade que estão em atraso.");
    expect(
      stopWorkAttentionEmptyMessage(DASHBOARD_ATTENTION.overdue, DASHBOARD_ATTENTION_SCOPE.mine),
    ).toBe("Você não possui ações vencidas.");
  });

  it("mine + due-soon", () => {
    expect(
      stopWorkAttentionTitle(DASHBOARD_ATTENTION.dueSoon, DASHBOARD_ATTENTION_SCOPE.mine),
    ).toBe("Minhas ações próximas do vencimento");
    expect(
      stopWorkAttentionSubtitle(DASHBOARD_ATTENTION.dueSoon, DASHBOARD_ATTENTION_SCOPE.mine),
    ).toBe("Ações sob sua responsabilidade com prazo próximo.");
    expect(
      stopWorkAttentionEmptyMessage(DASHBOARD_ATTENTION.dueSoon, DASHBOARD_ATTENTION_SCOPE.mine),
    ).toBe("Você não possui ações próximas do vencimento.");
  });
});

describe("stopWorkAttention copy — organizacional preservada", () => {
  it("organization + overdue (default)", () => {
    expect(stopWorkAttentionTitle(DASHBOARD_ATTENTION.overdue)).toBe("Ações vencidas");
    expect(stopWorkAttentionSubtitle(DASHBOARD_ATTENTION.overdue)).toBe(
      "Ações abertas em atraso conforme o dashboard.",
    );
    expect(stopWorkAttentionEmptyMessage(DASHBOARD_ATTENTION.overdue)).toBe(
      "Nenhuma ação vencida.",
    );
  });

  it("organization + due-soon", () => {
    expect(stopWorkAttentionTitle(DASHBOARD_ATTENTION.dueSoon)).toBe(
      "Ações próximas do vencimento",
    );
  });

  it("organization + pending", () => {
    expect(stopWorkAttentionTitle(DASHBOARD_ATTENTION.pending)).toBe("Ações pendentes");
  });
});

describe("escopo de cache (contrato)", () => {
  it("organization e mine são valores distintos para query key", () => {
    expect(DASHBOARD_ATTENTION_SCOPE.organization).not.toBe(DASHBOARD_ATTENTION_SCOPE.mine);
  });
});

import { describe, expect, it } from "vitest";

import type { ActionItemStatus } from "./action-plan";
import {
  DASHBOARD_DUE_SOON_DAYS_DEFAULT,
  isDueSoonActionItem,
  isOpenActionItem,
  isOverdueActionItem,
} from "./dashboard-formulas";
import { mapDashboardKpisRpcPayload } from "./dashboard-rpc";

/**
 * Contagem pessoal equivalente à RPC `personal.myDueSoonActions` e ao
 * fallback `getMyActionItemsSummary` — mesma fórmula canônica
 * `isDueSoonActionItem` + filtro de responsável no caller.
 */
function countMyDueSoonActions(
  rows: readonly {
    responsibleMemberId: string;
    status: ActionItemStatus;
    dueAt: string;
  }[],
  memberId: string,
  now: Date,
  dueSoonDays = DASHBOARD_DUE_SOON_DAYS_DEFAULT,
): number {
  return rows.filter(
    (row) =>
      row.responsibleMemberId === memberId &&
      isDueSoonActionItem({ status: row.status, dueAt: row.dueAt, now }, dueSoonDays),
  ).length;
}

describe("personal.myDueSoonActions — fórmula canônica e escopo", () => {
  const now = new Date("2026-09-06T12:00:00.000Z");
  const memberId = "member-self";
  const otherMemberId = "member-other";
  const dueSoonDays = DASHBOARD_DUE_SOON_DAYS_DEFAULT;

  const withinWindow = "2026-09-08T12:00:00.000Z"; // +2 dias
  const overdue = "2026-09-05T12:00:00.000Z"; // -1 dia
  const afterWindow = "2026-09-12T12:00:00.000Z"; // +6 dias
  const atNowBoundary = "2026-09-06T12:00:00.000Z"; // due_at === now
  const atWindowEnd = "2026-09-09T12:00:00.000Z"; // +3 dias exatos

  it("caso 1: ação do usuário que vence dentro da janela conta", () => {
    const rows = [
      {
        responsibleMemberId: memberId,
        status: "PENDING" as const,
        dueAt: withinWindow,
      },
    ];

    expect(countMyDueSoonActions(rows, memberId, now, dueSoonDays)).toBe(1);
    expect(isDueSoonActionItem({ status: "PENDING", dueAt: withinWindow, now }, dueSoonDays)).toBe(
      true,
    );
  });

  it("caso 2: ação do usuário já vencida não entra em myDueSoonActions", () => {
    const rows = [
      {
        responsibleMemberId: memberId,
        status: "IN_PROGRESS" as const,
        dueAt: overdue,
      },
    ];

    expect(countMyDueSoonActions(rows, memberId, now, dueSoonDays)).toBe(0);
    expect(isOverdueActionItem({ status: "IN_PROGRESS", dueAt: overdue, now })).toBe(true);
    expect(isDueSoonActionItem({ status: "IN_PROGRESS", dueAt: overdue, now }, dueSoonDays)).toBe(
      false,
    );
  });

  it("caso 3: ação do usuário que vence depois da janela não entra", () => {
    const rows = [
      {
        responsibleMemberId: memberId,
        status: "PENDING" as const,
        dueAt: afterWindow,
      },
    ];

    expect(countMyDueSoonActions(rows, memberId, now, dueSoonDays)).toBe(0);
  });

  it("caso 4: ação de outro responsável na janela não entra no KPI pessoal", () => {
    const rows = [
      {
        responsibleMemberId: otherMemberId,
        status: "PENDING" as const,
        dueAt: withinWindow,
      },
    ];

    expect(countMyDueSoonActions(rows, memberId, now, dueSoonDays)).toBe(0);
  });

  it("caso 5: ação concluída/cancelada na janela não entra", () => {
    const rows = [
      {
        responsibleMemberId: memberId,
        status: "COMPLETED" as const,
        dueAt: withinWindow,
      },
      {
        responsibleMemberId: memberId,
        status: "CANCELLED" as const,
        dueAt: withinWindow,
      },
    ];

    expect(countMyDueSoonActions(rows, memberId, now, dueSoonDays)).toBe(0);
    expect(isOpenActionItem("COMPLETED")).toBe(false);
    expect(isOpenActionItem("CANCELLED")).toBe(false);
  });

  it("caso 6: limites temporais alinhados a dueSoonActionItems (due_at >= now e <= now+days)", () => {
    expect(isDueSoonActionItem({ status: "PENDING", dueAt: atNowBoundary, now }, dueSoonDays)).toBe(
      true,
    );
    expect(isDueSoonActionItem({ status: "PENDING", dueAt: atWindowEnd, now }, dueSoonDays)).toBe(
      true,
    );

    const justAfterWindow = "2026-09-09T12:00:00.001Z";
    expect(
      isDueSoonActionItem({ status: "PENDING", dueAt: justAfterWindow, now }, dueSoonDays),
    ).toBe(false);

    const justBeforeNow = "2026-09-06T11:59:59.999Z";
    expect(isDueSoonActionItem({ status: "PENDING", dueAt: justBeforeNow, now }, dueSoonDays)).toBe(
      false,
    );
  });

  it("statuses abertos além de PENDING/IN_PROGRESS seguem a definição canônica de item aberto", () => {
    expect(
      isDueSoonActionItem({ status: "AWAITING_VALIDATION", dueAt: withinWindow, now }, dueSoonDays),
    ).toBe(true);
    expect(isDueSoonActionItem({ status: "REJECTED", dueAt: withinWindow, now }, dueSoonDays)).toBe(
      true,
    );
  });

  it("janela padrão permanece DASHBOARD_DUE_SOON_DAYS_DEFAULT = 3", () => {
    expect(DASHBOARD_DUE_SOON_DAYS_DEFAULT).toBe(3);
  });
});

describe("mapDashboardKpisRpcPayload — personal.myDueSoonActions", () => {
  const basePayload = {
    personal: {
      myPendingActions: 1,
      myOverdueActions: 2,
      myDueSoonActions: 3,
      myPendingAwareness: 4,
    },
    operational: {
      scopedOpenOccurrences: null,
      scopedPendingAwareness: null,
    },
    managerial: {
      activeOccurrences: null,
      pendingEvaluation: null,
      activeInterdictions: null,
      awaitingValidation: null,
      mdhoPendingApproval: null,
      overdueActionItems: null,
      dueSoonActionItems: null,
      openActionPlans: null,
      pendingAwarenessOrg: null,
      newOccurrencesInPeriod: null,
      avgEvaluationTimeMinutes: null,
      avgReleaseTimeMinutes: null,
      actionCompletionRate: null,
    },
  };

  it("lê myDueSoonActions do payload RPC", () => {
    const mapped = mapDashboardKpisRpcPayload(basePayload);
    expect(mapped.personal.myDueSoonActions).toBe(3);
  });

  it("normaliza myDueSoonActions ausente para 0 (compatibilidade pré-migration)", () => {
    const legacy = {
      ...basePayload,
      personal: {
        myPendingActions: 1,
        myOverdueActions: 2,
        myPendingAwareness: 4,
      },
    };

    const mapped = mapDashboardKpisRpcPayload(legacy);
    expect(mapped.personal.myDueSoonActions).toBe(0);
  });
});

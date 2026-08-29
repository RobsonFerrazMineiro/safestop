import { describe, expect, it } from "vitest";
import type { NotificationListItem } from "@safestop/types";

import { NOTIFICATION_FILTER_OPTIONS, type NotificationFilter } from "../types";
import { matchesNotificationFilter } from "./notification-filters";

function item(overrides: Partial<NotificationListItem> = {}): NotificationListItem {
  return {
    id: "n1",
    notificationEventId: "e1",
    eventType: "OCCURRENCE_CREATED",
    occurrenceId: "o1",
    title: "Título",
    message: "Mensagem",
    priority: "MEDIUM",
    requiresAwareness: false,
    readAt: null,
    awarenessConfirmedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("NOTIFICATION_FILTER_OPTIONS", () => {
  it("preserva quantidade, ids e labels", () => {
    expect(NOTIFICATION_FILTER_OPTIONS).toEqual([
      { id: "all", label: "Todas" },
      { id: "unread", label: "Não lidas" },
      { id: "pending-awareness", label: "Pendentes de ciência" },
      { id: "critical", label: "Críticas" },
      { id: "interdiction", label: "Interdições" },
      { id: "ver-and-act", label: "Ver e Agir" },
    ]);
  });
});

describe("matchesNotificationFilter", () => {
  it("trata read e awareness como critérios distintos", () => {
    const readWithoutAwareness = item({
      readAt: "2026-01-02T00:00:00.000Z",
      requiresAwareness: true,
      awarenessConfirmedAt: null,
    });

    expect(matchesNotificationFilter(readWithoutAwareness, "unread")).toBe(false);
    expect(matchesNotificationFilter(readWithoutAwareness, "pending-awareness")).toBe(true);
  });

  it("muda o conjunto visível conforme o filtro ativo sem confirmar ciência", () => {
    const unread = item({ id: "unread-1" });
    const critical = item({
      id: "crit-1",
      priority: "CRITICAL",
      readAt: "2026-01-02T00:00:00.000Z",
    });

    const byFilter: Record<NotificationFilter, boolean> = {
      all: matchesNotificationFilter(unread, "all"),
      unread: matchesNotificationFilter(unread, "unread"),
      "pending-awareness": matchesNotificationFilter(unread, "pending-awareness"),
      critical: matchesNotificationFilter(critical, "critical"),
      interdiction: matchesNotificationFilter(unread, "interdiction"),
      "ver-and-act": matchesNotificationFilter(unread, "ver-and-act"),
    };

    expect(byFilter).toEqual({
      all: true,
      unread: true,
      "pending-awareness": false,
      critical: true,
      interdiction: false,
      "ver-and-act": false,
    });
    expect(unread.awarenessConfirmedAt).toBeNull();
    expect(critical.awarenessConfirmedAt).toBeNull();
  });
});

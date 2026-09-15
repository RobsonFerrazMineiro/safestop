import { describe, expect, it } from "vitest";
import {
  occurrenceQueryKeys,
  organizationContactQueryKeys,
  notificationQueryKeys,
} from "@safestop/query-keys";
import { buildListOperationalOccurrencesRpcArgs } from "@safestop/types";

import { STOP_WORK_LIST_WORKSPACE_SERVER_FILTER_READY } from "@/features/stop-work/constants/workspace-list-scoping";
import {
  buildOperationalOccurrenceListQueryFilters,
  shouldEnableWorkspaceScopedOccurrenceList,
} from "@/features/occurrences/utils/operational-occurrence-list-query";

describe("Gate 13C.2 — lista Stop Work Workspace-scoped", () => {
  it("flag server-side filter ready === true", () => {
    expect(STOP_WORK_LIST_WORKSPACE_SERVER_FILTER_READY).toBe(true);
  });

  it("workspaceId A/B gera p_workspace_id A/B", () => {
    expect(
      buildListOperationalOccurrencesRpcArgs("org-1", { workspaceId: "ws-a" }).p_workspace_id,
    ).toBe("ws-a");
    expect(
      buildListOperationalOccurrencesRpcArgs("org-1", { workspaceId: "ws-b" }).p_workspace_id,
    ).toBe("ws-b");
  });

  it("paginação subsequente preserva p_workspace_id do Workspace ativo", () => {
    const args = buildListOperationalOccurrencesRpcArgs("org-1", {
      workspaceId: "ws-a",
      search: "valvula",
      pagination: {
        cursor: { sortValue: "2026-01-01T00:00:00.000Z", id: "occ-1" },
        limit: 20,
      },
    });

    expect(args.p_workspace_id).toBe("ws-a");
    expect(args.p_search).toBe("valvula");
    expect(args.p_cursor).toEqual({
      sortValue: "2026-01-01T00:00:00.000Z",
      id: "occ-1",
    });
  });

  it("query keys isolam Workspace A e B", () => {
    const filters = buildOperationalOccurrenceListQueryFilters({ search: "x" });
    const keyA = occurrenceQueryKeys.workspaceList("org-1", "ws-a", filters);
    const keyB = occurrenceQueryKeys.workspaceList("org-1", "ws-b", filters);

    expect(keyA).toEqual([
      "tenant",
      "org-1",
      "ws-a",
      "occurrences",
      "list",
      { search: "x", pagination: { limit: 20 } },
    ]);
    expect(keyB).toEqual([
      "tenant",
      "org-1",
      "ws-b",
      "occurrences",
      "list",
      { search: "x", pagination: { limit: 20 } },
    ]);
    expect(keyA).not.toEqual(keyB);
  });

  it("sem activeWorkspace a lista Workspace-aware não dispara", () => {
    expect(
      shouldEnableWorkspaceScopedOccurrenceList({
        optionEnabled: true,
        isOrgReady: true,
        isAuthzReady: true,
        organizationId: "org-1",
        workspaceId: undefined,
        canRead: true,
      }),
    ).toBe(false);
  });

  it("com activeWorkspace a lista pode disparar", () => {
    expect(
      shouldEnableWorkspaceScopedOccurrenceList({
        optionEnabled: true,
        isOrgReady: true,
        isAuthzReady: true,
        organizationId: "org-1",
        workspaceId: "ws-a",
        canRead: true,
      }),
    ).toBe(true);
  });

  it("builder omitindo workspaceId ainda expõe p_workspace_id null (legado RPC)", () => {
    const args = buildListOperationalOccurrencesRpcArgs("org-1", {});
    expect(args).toHaveProperty("p_workspace_id", null);
  });

  it("Contacts permanecem Organization-scoped", () => {
    const key = organizationContactQueryKeys.list("org-1");
    expect(key[0]).toBe("tenant");
    expect(key[1]).toBe("org-1");
    expect(key[2]).toBe("organization-contacts");
    expect(key).not.toContain("ws-a");
  });

  it("Notifications permanecem Organization-scoped neste Gate", () => {
    const key = notificationQueryKeys.list("org-1");
    expect(key[0]).toBe("tenant");
    expect(key[1]).toBe("org-1");
    expect(key).not.toContain("ws-a");
  });
});

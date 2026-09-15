import { describe, expect, it, vi } from "vitest";

import { resolveWorkspaceDeepLink } from "./resolve-workspace-deep-link";

describe("resolveWorkspaceDeepLink", () => {
  it("mesmo Workspace → continue (idempotente)", () => {
    expect(
      resolveWorkspaceDeepLink({
        occurrenceWorkspaceId: "b",
        activeWorkspaceId: "b",
        accessibleWorkspaceIds: ["a", "b"],
      }),
    ).toEqual({ type: "continue" });
  });

  it("cross-Workspace autorizado → auto-switch", () => {
    expect(
      resolveWorkspaceDeepLink({
        occurrenceWorkspaceId: "b",
        activeWorkspaceId: "a",
        accessibleWorkspaceIds: ["a", "b"],
      }),
    ).toEqual({ type: "auto-switch", workspaceId: "b" });
  });

  it("não autorizado → forbidden", () => {
    expect(
      resolveWorkspaceDeepLink({
        occurrenceWorkspaceId: "c",
        activeWorkspaceId: "a",
        accessibleWorkspaceIds: ["a", "b"],
      }),
    ).toEqual({ type: "forbidden" });
  });

  it("legado NULL → legacy-null", () => {
    expect(
      resolveWorkspaceDeepLink({
        occurrenceWorkspaceId: null,
        activeWorkspaceId: "a",
        accessibleWorkspaceIds: ["a"],
      }),
    ).toEqual({ type: "legacy-null" });
  });

  it("após alinhamento, decisão continue não solicita nova troca", () => {
    const setActiveWorkspace = vi.fn();
    const decision = resolveWorkspaceDeepLink({
      occurrenceWorkspaceId: "b",
      activeWorkspaceId: "b",
      accessibleWorkspaceIds: ["a", "b"],
    });

    if (decision.type !== "continue") {
      setActiveWorkspace(decision);
    }

    expect(decision).toEqual({ type: "continue" });
    expect(setActiveWorkspace).not.toHaveBeenCalled();
  });
});

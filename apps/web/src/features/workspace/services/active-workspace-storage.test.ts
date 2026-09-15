import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearStoredActiveWorkspaceId,
  getStoredActiveWorkspaceId,
  setStoredActiveWorkspaceId,
} from "./active-workspace-storage";

describe("active-workspace-storage", () => {
  const userId = "user-1";
  const organizationId = "org-1";
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => {
          memory.set(key, value);
        },
        removeItem: (key: string) => {
          memory.delete(key);
        },
      },
    });
  });

  it("persiste e restaura preferência por user+org", () => {
    clearStoredActiveWorkspaceId(userId, organizationId);
    setStoredActiveWorkspaceId(userId, organizationId, "ws-a");
    expect(getStoredActiveWorkspaceId(userId, organizationId)).toBe("ws-a");
    clearStoredActiveWorkspaceId(userId, organizationId);
    expect(getStoredActiveWorkspaceId(userId, organizationId)).toBeNull();
  });

  it("isola preferência entre Organizations", () => {
    setStoredActiveWorkspaceId(userId, "org-1", "ws-a");
    setStoredActiveWorkspaceId(userId, "org-2", "ws-x");
    expect(getStoredActiveWorkspaceId(userId, "org-1")).toBe("ws-a");
    expect(getStoredActiveWorkspaceId(userId, "org-2")).toBe("ws-x");
    clearStoredActiveWorkspaceId(userId, "org-1");
    clearStoredActiveWorkspaceId(userId, "org-2");
  });
});

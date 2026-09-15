import { describe, expect, it } from "vitest";

import { resolveActiveWorkspace } from "./resolve-active-workspace";
import type { AccessibleWorkspace } from "../types";

const ws = (id: string, name = id): AccessibleWorkspace => ({
  id,
  name,
  code: null,
  isActive: true,
  ownerOrganizationId: null,
});

describe("resolveActiveWorkspace", () => {
  it("1 org / 1 WS → auto-select", () => {
    expect(resolveActiveWorkspace([ws("a")], null)?.id).toBe("a");
    expect(resolveActiveWorkspace([ws("a")], "ignored")?.id).toBe("a");
  });

  it("1 org / 2 WS → restaura preferência válida", () => {
    expect(resolveActiveWorkspace([ws("a"), ws("b")], "b")?.id).toBe("b");
  });

  it("1 org / 2 WS → preferência revogada é ignorada", () => {
    expect(resolveActiveWorkspace([ws("a"), ws("b")], "revoked")).toBeNull();
  });

  it("1 org / 2 WS → sem preferência exige seleção", () => {
    expect(resolveActiveWorkspace([ws("a"), ws("b")], null)).toBeNull();
  });

  it("zero WS → activeWorkspace null", () => {
    expect(resolveActiveWorkspace([], "a")).toBeNull();
  });
});

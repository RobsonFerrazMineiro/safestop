import { describe, expect, it } from "vitest";

import { buildActiveWorkspacePreferenceKey } from "../types";

describe("active workspace preference key", () => {
  it("usa a chave conceitual obrigatória do Gate 13D", () => {
    expect(buildActiveWorkspacePreferenceKey("user-1", "org-1")).toBe(
      "safestop:activeWorkspace:user-1:org-1",
    );
  });
});

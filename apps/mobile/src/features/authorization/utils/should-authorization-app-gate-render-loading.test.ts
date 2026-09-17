import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { shouldAuthorizationAppGateRenderLoading } from "./should-authorization-app-gate-render-loading";

describe("Gate 13X.2.14 — AuthorizationAppGate", () => {
  it("AppGate com isSwitching ainda renderiza children", () => {
    expect(
      shouldAuthorizationAppGateRenderLoading({
        isLoading: true,
        isSwitching: true,
      }),
    ).toBe(false);
  });

  it("carga inicial sem switching ainda mostra loading", () => {
    expect(
      shouldAuthorizationAppGateRenderLoading({
        isLoading: true,
        isSwitching: false,
      }),
    ).toBe(true);
  });

  it("gate e useRequirePermission respeitam isSwitching", () => {
    const gate = readFileSync(
      resolve(__dirname, "../components/authorization-app-gate.tsx"),
      "utf8",
    );
    const requirePermission = readFileSync(
      resolve(__dirname, "../hooks/use-require-permission.ts"),
      "utf8",
    );

    expect(gate).toContain("shouldAuthorizationAppGateRenderLoading");
    expect(gate).toContain("isSwitching");
    expect(requirePermission).toContain("isSwitching");
    expect(requirePermission).toContain("if (isLoading || !isReady || isSwitching)");
  });
});

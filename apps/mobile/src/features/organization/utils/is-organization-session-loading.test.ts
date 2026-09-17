import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { isOrganizationSessionLoading } from "./is-organization-session-loading";

describe("Gate 13X.2.14 — sessão de organização", () => {
  it("org already-ready + isFetching ⇒ isLoading false", () => {
    expect(
      isOrganizationSessionLoading({
        isListLoading: false,
        isFetching: true,
        hasResolvedActiveOrganization: true,
      }),
    ).toBe(false);
  });

  it("carga inicial ainda é loading", () => {
    expect(
      isOrganizationSessionLoading({
        isListLoading: true,
        isFetching: true,
        hasResolvedActiveOrganization: false,
      }),
    ).toBe(true);
    expect(
      isOrganizationSessionLoading({
        isListLoading: false,
        isFetching: false,
        hasResolvedActiveOrganization: false,
      }),
    ).toBe(true);
  });

  it("provider usa isOrganizationSessionLoading e não isFetching sozinho", () => {
    const source = readFileSync(
      resolve(__dirname, "../provider/organization-provider.tsx"),
      "utf8",
    );

    expect(source).toContain("isOrganizationSessionLoading");
    expect(source).not.toContain(
      "const isLoading = isListLoading || isFetching || !hasResolvedActiveOrganization",
    );
  });
});

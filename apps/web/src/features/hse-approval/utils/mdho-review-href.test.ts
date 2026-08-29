import { describe, expect, it } from "vitest";

import { mdhoReviewHref } from "./mdho-review-href";

describe("mdhoReviewHref", () => {
  it("preserva o deep link ?section=mdho-review", () => {
    expect(mdhoReviewHref("occ-1")).toBe("/stop-work/occ-1?section=mdho-review");
  });
});

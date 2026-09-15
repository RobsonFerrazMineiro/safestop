import { describe, expect, it, vi } from "vitest";

import { openEvidenceSignedUrl } from "./open-evidence-signed-url";

describe("openEvidenceSignedUrl", () => {
  it("abre signed URL em nova aba com noopener e noreferrer", () => {
    const open = vi.fn();
    vi.stubGlobal("window", { open });

    openEvidenceSignedUrl("https://example.test/signed.pdf");

    expect(open).toHaveBeenCalledWith(
      "https://example.test/signed.pdf",
      "_blank",
      "noopener,noreferrer",
    );

    vi.unstubAllGlobals();
  });
});

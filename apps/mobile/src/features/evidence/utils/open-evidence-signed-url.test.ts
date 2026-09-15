import { describe, expect, it, vi } from "vitest";

const canOpenURL = vi.fn();
const openURL = vi.fn();

vi.mock("react-native", () => ({
  Linking: {
    canOpenURL: (...args: unknown[]) => canOpenURL(...args),
    openURL: (...args: unknown[]) => openURL(...args),
  },
}));

import { openEvidenceSignedUrl } from "./open-evidence-signed-url";

describe("openEvidenceSignedUrl", () => {
  it("abre signed URL via Linking", async () => {
    canOpenURL.mockResolvedValue(true);
    openURL.mockResolvedValue(undefined);

    await openEvidenceSignedUrl("https://example.supabase.co/storage/v1/object/sign/x?token=y");

    expect(canOpenURL).toHaveBeenCalled();
    expect(openURL).toHaveBeenCalledWith(
      "https://example.supabase.co/storage/v1/object/sign/x?token=y",
    );
  });

  it("falha quando o dispositivo não consegue abrir a URL", async () => {
    canOpenURL.mockResolvedValue(false);

    await expect(openEvidenceSignedUrl("https://invalid.example")).rejects.toThrow(
      "Não foi possível abrir o arquivo neste dispositivo.",
    );
  });
});

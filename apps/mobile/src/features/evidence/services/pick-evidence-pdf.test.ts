import { beforeEach, describe, expect, it, vi } from "vitest";
import { OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES } from "@safestop/types";

const getDocumentAsync = vi.fn();

vi.mock("expo-document-picker", () => ({
  getDocumentAsync: (...args: unknown[]) => getDocumentAsync(...args),
}));

vi.mock("./prepare-evidence-asset", () => ({
  EVIDENCE_MAX_SIZE_MESSAGE: `Arquivo deve ter no máximo ${OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES / (1024 * 1024)} MiB.`,
  EVIDENCE_PDF_MIME_REQUIRED_MESSAGE: "O documento precisa ser um PDF válido (application/pdf).",
}));

import {
  EVIDENCE_MAX_SIZE_MESSAGE,
  EVIDENCE_PDF_MIME_REQUIRED_MESSAGE,
} from "./prepare-evidence-asset";
import { EVIDENCE_PDF_PICKER_INCONSISTENT_MESSAGE, pickEvidencePdf } from "./pick-evidence-pdf";

describe("pickEvidencePdf", () => {
  beforeEach(() => {
    getDocumentAsync.mockReset();
  });

  it("cancelamento real não gera erro", async () => {
    getDocumentAsync.mockResolvedValue({ canceled: true, assets: null });

    await expect(pickEvidencePdf()).resolves.toEqual({ canceled: true });
  });

  it("canceled:false + asset válido retorna PDF", async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file://ok.pdf",
          name: "ok.pdf",
          mimeType: "application/pdf",
          size: 1024,
        },
      ],
    });

    await expect(pickEvidencePdf()).resolves.toEqual({
      canceled: false,
      asset: {
        uri: "file://ok.pdf",
        fileName: "ok.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
      },
    });
  });

  it("canceled:false + assets vazio gera erro controlado", async () => {
    getDocumentAsync.mockResolvedValue({ canceled: false, assets: [] });

    await expect(pickEvidencePdf()).rejects.toThrow(EVIDENCE_PDF_PICKER_INCONSISTENT_MESSAGE);
  });

  it("MIME PDF válido é aceito", async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://a.pdf", name: "a.pdf", mimeType: "application/pdf", size: 10 }],
    });

    const result = await pickEvidencePdf();
    expect(result.canceled).toBe(false);
    if (!result.canceled) {
      expect(result.asset.mimeType).toBe("application/pdf");
    }
  });

  it("MIME ausente é rejeitado", async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://a.pdf", name: "a.pdf", mimeType: undefined, size: 10 }],
    });

    await expect(pickEvidencePdf()).rejects.toThrow(EVIDENCE_PDF_MIME_REQUIRED_MESSAGE);
  });

  it("MIME inválido é rejeitado", async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file://a.pdf",
          name: "a.pdf",
          mimeType: "application/octet-stream",
          size: 10,
        },
      ],
    });

    await expect(pickEvidencePdf()).rejects.toThrow(EVIDENCE_PDF_MIME_REQUIRED_MESSAGE);
  });

  it("size válido é preservado", async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://a.pdf", name: "a.pdf", mimeType: "application/pdf", size: 512 }],
    });

    const result = await pickEvidencePdf();
    expect(result.canceled).toBe(false);
    if (!result.canceled) {
      expect(result.asset.fileSize).toBe(512);
    }
  });

  it("size ausente ou 0 vira null para fallback FileSystem", async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file://a.pdf", name: "a.pdf", mimeType: "application/pdf", size: 0 }],
    });

    const result = await pickEvidencePdf();
    expect(result.canceled).toBe(false);
    if (!result.canceled) {
      expect(result.asset.fileSize).toBeNull();
    }
  });

  it("rejeita PDF acima de 10 MiB", async () => {
    getDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file://grande.pdf",
          name: "grande.pdf",
          mimeType: "application/pdf",
          size: OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES + 1,
        },
      ],
    });

    await expect(pickEvidencePdf()).rejects.toThrow(EVIDENCE_MAX_SIZE_MESSAGE);
  });

  it("configura DocumentPicker somente para application/pdf", async () => {
    getDocumentAsync.mockResolvedValue({ canceled: true, assets: null });
    await pickEvidencePdf();

    expect(getDocumentAsync).toHaveBeenCalledWith({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });
  });
});

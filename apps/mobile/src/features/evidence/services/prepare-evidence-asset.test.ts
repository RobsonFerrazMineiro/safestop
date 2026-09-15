import { beforeEach, describe, expect, it, vi } from "vitest";
import { OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES } from "@safestop/types";

vi.mock("./compress-image", () => ({
  compressEvidenceImage: vi.fn(async (uri: string) => ({
    uri: `${uri}-compressed`,
    fileName: "evidencia-compressed.jpg",
    mimeType: "image/jpeg" as const,
    fileSize: 512,
    width: 100,
    height: 80,
  })),
  resolvePickerMimeType: vi.fn((mime: string | undefined, uri: string) => {
    if (mime === "image/jpeg" || mime === "image/png" || mime === "image/webp") {
      return mime;
    }
    if (uri.endsWith(".png")) return "image/png";
    if (uri.endsWith(".webp")) return "image/webp";
    return "image/jpeg";
  }),
}));

vi.mock("../utils/resolve-local-file-size", () => ({
  resolveLocalFileSize: vi.fn(async (_uri: string, reported: number | null | undefined) => {
    if (typeof reported === "number" && reported > 0) {
      return reported;
    }
    return 2048;
  }),
}));

import { compressEvidenceImage } from "./compress-image";
import {
  EVIDENCE_MAX_SIZE_MESSAGE,
  EVIDENCE_PDF_MIME_REQUIRED_MESSAGE,
  EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE,
  prepareEvidenceAssetForUpload,
} from "./prepare-evidence-asset";

describe("prepareEvidenceAssetForUpload", () => {
  beforeEach(() => {
    vi.mocked(compressEvidenceImage).mockClear();
  });

  it("envia JPEG pelo pipeline de imagem", async () => {
    const result = await prepareEvidenceAssetForUpload({
      uri: "file://foto.jpg",
      mimeType: "image/jpeg",
      fileName: "foto.jpg",
      fileSize: 1024,
    });

    expect(compressEvidenceImage).toHaveBeenCalledWith("file://foto.jpg");
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("envia PNG pelo pipeline de imagem", async () => {
    await prepareEvidenceAssetForUpload({
      uri: "file://foto.png",
      mimeType: "image/png",
      fileName: "foto.png",
      fileSize: 1024,
    });
    expect(compressEvidenceImage).toHaveBeenCalled();
  });

  it("envia WebP pelo pipeline de imagem", async () => {
    await prepareEvidenceAssetForUpload({
      uri: "file://foto.webp",
      mimeType: "image/webp",
      fileName: "foto.webp",
      fileSize: 1024,
    });
    expect(compressEvidenceImage).toHaveBeenCalled();
  });

  it("não processa PDF com ImageManipulator e preserva MIME/nome/tamanho", async () => {
    const result = await prepareEvidenceAssetForUpload({
      uri: "file://laudo.pdf",
      mimeType: "application/pdf",
      fileName: "laudo.pdf",
      fileSize: 2048,
    });

    expect(compressEvidenceImage).not.toHaveBeenCalled();
    expect(result.mimeType).toBe("application/pdf");
    expect(result.fileName).toBe("laudo.pdf");
    expect(result.fileSize).toBe(2048);
    expect(result.uri).toBe("file://laudo.pdf");
    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
  });

  it("rejeita text/plain", async () => {
    await expect(
      prepareEvidenceAssetForUpload({
        uri: "file://a.txt",
        mimeType: "text/plain",
        fileName: "a.txt",
        fileSize: 100,
      }),
    ).rejects.toThrow(EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE);
    expect(compressEvidenceImage).not.toHaveBeenCalled();
  });

  it("rejeita application/octet-stream", async () => {
    await expect(
      prepareEvidenceAssetForUpload({
        uri: "file://a.bin",
        mimeType: "application/octet-stream",
        fileName: "a.bin",
        fileSize: 100,
      }),
    ).rejects.toThrow(EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE);
  });

  it("rejeita PDF sem MIME válido (não assume pela extensão)", async () => {
    await expect(
      prepareEvidenceAssetForUpload({
        uri: "file://laudo.pdf",
        mimeType: null,
        fileName: "laudo.pdf",
        fileSize: 100,
      }),
    ).rejects.toThrow(EVIDENCE_PDF_MIME_REQUIRED_MESSAGE);
    expect(compressEvidenceImage).not.toHaveBeenCalled();
  });

  it("rejeita PDF acima de 10 MiB", async () => {
    await expect(
      prepareEvidenceAssetForUpload({
        uri: "file://grande.pdf",
        mimeType: "application/pdf",
        fileName: "grande.pdf",
        fileSize: OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES + 1,
      }),
    ).rejects.toThrow(EVIDENCE_MAX_SIZE_MESSAGE);
    expect(compressEvidenceImage).not.toHaveBeenCalled();
  });
});

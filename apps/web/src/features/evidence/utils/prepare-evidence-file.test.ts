import { describe, expect, it, vi, beforeEach } from "vitest";
import { OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES } from "@safestop/types";

import {
  EVIDENCE_MAX_SIZE_MESSAGE,
  EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE,
  prepareEvidenceFileForUpload,
} from "./prepare-evidence-file";

vi.mock("./compress-image", () => ({
  compressImageForUpload: vi.fn(async (file: File) => ({
    blob: new Blob([new Uint8Array([1, 2, 3])], { type: file.type }),
    mimeType: file.type,
    fileName: file.name,
    fileSize: 3,
  })),
}));

import { compressImageForUpload } from "./compress-image";

function makeFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(Math.min(sizeBytes, 64));
  const file = new File([buffer], name, { type });
  Object.defineProperty(file, "size", { value: sizeBytes });
  return file;
}

describe("prepareEvidenceFileForUpload", () => {
  beforeEach(() => {
    vi.mocked(compressImageForUpload).mockClear();
  });

  it("envia JPEG pelo pipeline de compressão", async () => {
    const file = makeFile("foto.jpg", "image/jpeg", 1024);
    const result = await prepareEvidenceFileForUpload(file);

    expect(compressImageForUpload).toHaveBeenCalledWith(file);
    expect(result.mimeType).toBe("image/jpeg");
  });

  it("envia PNG pelo pipeline de compressão", async () => {
    const file = makeFile("foto.png", "image/png", 1024);
    await prepareEvidenceFileForUpload(file);
    expect(compressImageForUpload).toHaveBeenCalledWith(file);
  });

  it("envia WebP pelo pipeline de compressão", async () => {
    const file = makeFile("foto.webp", "image/webp", 1024);
    await prepareEvidenceFileForUpload(file);
    expect(compressImageForUpload).toHaveBeenCalledWith(file);
  });

  it("não comprime PDF e preserva application/pdf", async () => {
    const file = makeFile("laudo.pdf", "application/pdf", 2048);
    const result = await prepareEvidenceFileForUpload(file);

    expect(compressImageForUpload).not.toHaveBeenCalled();
    expect(result.mimeType).toBe("application/pdf");
    expect(result.fileName).toBe("laudo.pdf");
    expect(result.fileSize).toBe(2048);
    expect(result.blob).toBe(file);
  });

  it("rejeita text/plain", async () => {
    await expect(
      prepareEvidenceFileForUpload(makeFile("a.txt", "text/plain", 100)),
    ).rejects.toThrow(EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE);
    expect(compressImageForUpload).not.toHaveBeenCalled();
  });

  it("rejeita application/octet-stream", async () => {
    await expect(
      prepareEvidenceFileForUpload(makeFile("a.bin", "application/octet-stream", 100)),
    ).rejects.toThrow(EVIDENCE_UNSUPPORTED_FORMAT_MESSAGE);
  });

  it("rejeita arquivo acima de 10 MiB", async () => {
    const oversized = makeFile(
      "grande.pdf",
      "application/pdf",
      OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES + 1,
    );

    await expect(prepareEvidenceFileForUpload(oversized)).rejects.toThrow(
      EVIDENCE_MAX_SIZE_MESSAGE,
    );
    expect(compressImageForUpload).not.toHaveBeenCalled();
  });
});

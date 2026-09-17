import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const readAsStringAsync = vi.fn();

vi.mock("expo-file-system/legacy", () => ({
  EncodingType: {
    Base64: "base64",
  },
  readAsStringAsync: (...args: unknown[]) => readAsStringAsync(...args),
}));

import { readLocalFileBody } from "./read-local-file-body";

describe("Gate 13X.2.12 — leitura local do upload de evidência", () => {
  beforeEach(() => {
    readAsStringAsync.mockReset();
  });

  it("FileSystem legacy produz body para storage.upload", async () => {
    readAsStringAsync.mockResolvedValue("QQ==");

    const body = await readLocalFileBody("file:///cache/ImageManipulator/photo.jpg");

    expect(readAsStringAsync).toHaveBeenCalledWith("file:///cache/ImageManipulator/photo.jpg", {
      encoding: "base64",
    });
    expect(body).toBeInstanceOf(Uint8Array);
    expect(Array.from(body)).toEqual([65]);
  });

  it("falha de leitura vira mensagem operacional, sem fetch", async () => {
    readAsStringAsync.mockRejectedValue(new Error("Network request failed"));

    await expect(readLocalFileBody("file://a.jpg")).rejects.toThrow(
      "Não foi possível ler o arquivo local.",
    );
  });

  it("uploadAttachmentToStorage não usa fetch(uri)", () => {
    const uploadSource = readFileSync(resolve(__dirname, "../services/evidence-upload.ts"), "utf8");
    const readSource = readFileSync(resolve(__dirname, "./read-local-file-body.ts"), "utf8");

    expect(uploadSource).toContain("readLocalFileBody");
    expect(uploadSource).not.toMatch(/fetch\(\s*params\.uri\s*\)/);
    expect(uploadSource).not.toMatch(/fetch\(\s*uri\s*\)/);
    expect(readSource).toMatch(/import \* as FileSystem from "expo-file-system\/legacy"/);
    expect(readSource).not.toMatch(/import .+ from "expo-file-system";/);
    expect(readSource).toContain("readAsStringAsync");
  });
});

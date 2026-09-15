import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const manipulateAsync = vi.fn();
const resolveLocalFileSize = vi.fn();

vi.mock("expo-image-manipulator", () => ({
  manipulateAsync: (...args: unknown[]) => manipulateAsync(...args),
  SaveFormat: { JPEG: "jpeg" },
}));

vi.mock("../utils/resolve-local-file-size", () => ({
  resolveLocalFileSize: (...args: unknown[]) => resolveLocalFileSize(...args),
}));

import { compressEvidenceImage, resolvePickerMimeType } from "./compress-image";

describe("compressEvidenceImage regressão imagem", () => {
  beforeEach(() => {
    manipulateAsync.mockReset();
    resolveLocalFileSize.mockReset();

    manipulateAsync.mockResolvedValue({
      uri: "file://compressed.jpg",
      width: 800,
      height: 600,
    });
    resolveLocalFileSize.mockResolvedValue(1024);
  });

  it("prepara imagem via ImageManipulator e resolve tamanho pelo helper FileSystem", async () => {
    const result = await compressEvidenceImage("file://foto.jpg");

    expect(manipulateAsync).toHaveBeenCalled();
    expect(resolveLocalFileSize).toHaveBeenCalledWith("file://compressed.jpg", null);
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.fileSize).toBe(1024);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it("resolvePickerMimeType aceita jpeg/png/webp da galeria/câmera", () => {
    expect(resolvePickerMimeType("image/jpeg", "x")).toBe("image/jpeg");
    expect(resolvePickerMimeType("image/png", "x")).toBe("image/png");
    expect(resolvePickerMimeType("image/webp", "x")).toBe("image/webp");
  });

  it("compress-image não importa expo-file-system moderno diretamente", () => {
    const source = readFileSync(resolve(__dirname, "./compress-image.ts"), "utf8");

    expect(source).toContain("resolveLocalFileSize");
    expect(source).not.toMatch(/from ["']expo-file-system["']/);
    expect(source).not.toMatch(/from ["']expo-file-system\/legacy["']/);
  });
});

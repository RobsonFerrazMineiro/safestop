import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getInfoAsync = vi.fn();

vi.mock("expo-file-system/legacy", () => ({
  getInfoAsync: (...args: unknown[]) => getInfoAsync(...args),
}));

import { resolveLocalFileSize } from "./resolve-local-file-size";

describe("resolveLocalFileSize", () => {
  beforeEach(() => {
    getInfoAsync.mockReset();
  });

  it("usa size reportado quando > 0 sem chamar FileSystem", async () => {
    await expect(resolveLocalFileSize("file://a.pdf", 2048)).resolves.toBe(2048);
    expect(getInfoAsync).not.toHaveBeenCalled();
  });

  it("ignora size 0 e usa fallback legacy getInfoAsync", async () => {
    getInfoAsync.mockResolvedValue({ exists: true, size: 4096 });

    await expect(resolveLocalFileSize("file://a.pdf", 0)).resolves.toBe(4096);
    expect(getInfoAsync).toHaveBeenCalledWith("file://a.pdf");
  });

  it("usa fallback quando size está ausente", async () => {
    getInfoAsync.mockResolvedValue({ exists: true, size: 1024 });

    await expect(resolveLocalFileSize("file://a.jpg", null)).resolves.toBe(1024);
    expect(getInfoAsync).toHaveBeenCalledWith("file://a.jpg");
  });

  it("rejeita quando FileSystem não retorna tamanho válido", async () => {
    getInfoAsync.mockResolvedValue({ exists: true, size: 0 });

    await expect(resolveLocalFileSize("file://a.pdf", null)).rejects.toThrow(
      "Não foi possível determinar o tamanho do arquivo.",
    );
  });

  it("não importa o stub moderno de expo-file-system que lança no Expo 57", () => {
    const source = readFileSync(resolve(__dirname, "./resolve-local-file-size.ts"), "utf8");

    expect(source).toMatch(/import \* as FileSystem from "expo-file-system\/legacy"/);
    expect(source).not.toMatch(/import .+ from "expo-file-system";/);
  });
});

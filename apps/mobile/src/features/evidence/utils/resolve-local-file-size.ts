import * as FileSystem from "expo-file-system/legacy";

/**
 * Estratégia de tamanho:
 * 1. Se o picker informar `size` numérico válido (> 0), usa esse valor.
 * 2. Caso contrário, lê via `expo-file-system/legacy` `getInfoAsync` (API suportada no Expo 57).
 * 3. Se ainda assim for impossível determinar, rejeita — evita `fileSize: 0` artificial no contrato RPC.
 *
 * Não usar `import … from "expo-file-system"` (exporta stubs que lançam em runtime no SDK 57).
 */
export async function resolveLocalFileSize(
  uri: string,
  reportedSize: number | null | undefined,
): Promise<number> {
  if (typeof reportedSize === "number" && Number.isFinite(reportedSize) && reportedSize > 0) {
    return reportedSize;
  }

  const info = await FileSystem.getInfoAsync(uri);

  if (!info.exists || typeof info.size !== "number" || info.size <= 0) {
    throw new Error("Não foi possível determinar o tamanho do arquivo.");
  }

  return info.size;
}

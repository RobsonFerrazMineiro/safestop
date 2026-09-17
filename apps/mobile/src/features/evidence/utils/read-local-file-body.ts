import * as FileSystem from "expo-file-system/legacy";

function decodeBase64ToBytes(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

/**
 * Lê bytes do arquivo local para Storage.
 * No Android, URI file:// do ImageManipulator não é lida via HTTP client.
 * Usar `expo-file-system/legacy`. Não usar o stub moderno de expo-file-system.
 */
export async function readLocalFileBody(uri: string): Promise<Uint8Array> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (typeof base64 !== "string" || base64.length === 0) {
      throw new Error("empty");
    }

    return decodeBase64ToBytes(base64);
  } catch {
    throw new Error("Não foi possível ler o arquivo local.");
  }
}

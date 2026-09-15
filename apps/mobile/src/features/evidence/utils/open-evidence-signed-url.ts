import { Linking } from "react-native";

/**
 * Abre evidência via signed URL (bucket privado).
 * PDF e imagens usam o visualizador/navegador do SO — sem viewer embutido.
 */
export async function openEvidenceSignedUrl(url: string): Promise<void> {
  const canOpen = await Linking.canOpenURL(url);

  if (!canOpen) {
    throw new Error("Não foi possível abrir o arquivo neste dispositivo.");
  }

  await Linking.openURL(url);
}

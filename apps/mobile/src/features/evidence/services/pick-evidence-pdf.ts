import * as DocumentPicker from "expo-document-picker";
import { OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES } from "@safestop/types";

import {
  EVIDENCE_MAX_SIZE_MESSAGE,
  EVIDENCE_PDF_MIME_REQUIRED_MESSAGE,
  type EvidenceSourceAsset,
} from "./prepare-evidence-asset";
import { isEvidencePdfMimeType } from "../utils/is-evidence-mime";

export const EVIDENCE_PDF_PICKER_INCONSISTENT_MESSAGE =
  "Não foi possível obter o arquivo selecionado. Tente novamente.";

export type PickEvidencePdfResult =
  { canceled: true } | { canceled: false; asset: EvidenceSourceAsset };

/**
 * Seleciona um PDF via DocumentPicker (somente application/pdf).
 * Cancelamento real do usuário → `{ canceled: true }` sem erro.
 * `canceled: false` sem asset → erro controlado (não tratado como cancelamento).
 */
export async function pickEvidencePdf(): Promise<PickEvidencePdfResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled) {
    return { canceled: true };
  }

  const asset = result.assets?.[0];

  if (!asset) {
    throw new Error(EVIDENCE_PDF_PICKER_INCONSISTENT_MESSAGE);
  }

  const mimeType = asset.mimeType?.trim() ?? "";

  if (!isEvidencePdfMimeType(mimeType)) {
    throw new Error(EVIDENCE_PDF_MIME_REQUIRED_MESSAGE);
  }

  if (typeof asset.size === "number" && asset.size > OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
    throw new Error(EVIDENCE_MAX_SIZE_MESSAGE);
  }

  return {
    canceled: false,
    asset: {
      uri: asset.uri,
      fileName: asset.name,
      mimeType: "application/pdf",
      fileSize: typeof asset.size === "number" && asset.size > 0 ? asset.size : null,
    },
  };
}

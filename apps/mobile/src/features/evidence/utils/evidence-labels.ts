import type { EvidenceUploadQueueStatus } from "../types";

export function getAttachmentTypeLabel(type: "INITIAL_EVIDENCE"): string {
  if (type === "INITIAL_EVIDENCE") {
    return "Evidência inicial";
  }

  return type;
}

export function getQueueStatusLabel(status: EvidenceUploadQueueStatus, progress: number): string {
  switch (status) {
    case "queued":
    case "compressing":
    case "preparing":
      return "Preparando";
    case "uploading":
      return `Enviando ${Math.round(progress * 100)}%`;
    case "completing":
      return "Registrando…";
    case "completed":
      return "Concluído";
    case "failed":
      return "Falha no envio";
    default:
      return status;
  }
}

export function formatEvidenceDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

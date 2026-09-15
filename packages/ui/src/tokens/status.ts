/**
 * Famílias de chip de status — spec 0a.1 (PR-0a).
 * Receita default: soft (fg + bg + border). Sem hex exclusivo por enum.
 * Chaves alinhadas a OCCURRENCE_STATUSES em @safestop/types (sem dependência).
 */

export const statusChipFamilies = [
  "success",
  "warning",
  "destructive",
  "info",
  "primary",
  "muted",
] as const;

export type StatusChipFamily = (typeof statusChipFamilies)[number];

export type StatusChipTone = {
  readonly foreground: string;
  readonly background: string;
  readonly border: string;
};

/**
 * Pares de chip (não são paleta de marca).
 * `primary` aqui é o chip vermelho — distinto de `--primary` / `colors.primary`.
 */
export const statusChip = {
  success: { foreground: "#BBF7D0", background: "#14532D", border: "#16A34A" },
  warning: { foreground: "#FDE68A", background: "#422006", border: "#FACC15" },
  destructive: { foreground: "#FECACA", background: "#7F1D1D", border: "#DC2626" },
  info: { foreground: "#BFDBFE", background: "#1E3A5F", border: "#2563EB" },
  primary: { foreground: "#FECACA", background: "#4A0D0D", border: "#D32F2F" },
  muted: { foreground: "#9CA3AF", background: "#20242D", border: "#2E3440" },
} as const satisfies Record<StatusChipFamily, StatusChipTone>;

/**
 * Alternativa aprovada (QA): warning sólido. Default permanece `statusChip.warning`.
 * Nunca texto claro (#F3F4F6) sobre âmbar sólido.
 */
export const statusChipWarningSolid = {
  foreground: "#0F1115",
  background: "#FACC15",
  border: "#FACC15",
} as const satisfies StatusChipTone;

export const occurrenceStatusKeys = [
  "PARALISACAO_PREVENTIVA",
  "EM_AVALIACAO",
  "VER_E_AGIR",
  "INTERDICAO_CONFIRMADA",
  "MDHO_EM_PREENCHIMENTO",
  "AGUARDANDO_APROVACAO_HSE",
  "AGUARDANDO_REGISTRO_IMS",
  "EM_TRATATIVA",
  "AGUARDANDO_VALIDACAO",
  "LIBERADA",
  "ENCERRADA",
  "CANCELADA",
] as const;

export type OccurrenceStatusTokenKey = (typeof occurrenceStatusKeys)[number];

export const occurrenceStatusTone = {
  PARALISACAO_PREVENTIVA: "info",
  EM_AVALIACAO: "warning",
  VER_E_AGIR: "warning",
  INTERDICAO_CONFIRMADA: "destructive",
  MDHO_EM_PREENCHIMENTO: "info",
  AGUARDANDO_APROVACAO_HSE: "warning",
  AGUARDANDO_REGISTRO_IMS: "warning",
  EM_TRATATIVA: "info",
  AGUARDANDO_VALIDACAO: "warning",
  LIBERADA: "success",
  ENCERRADA: "muted",
  CANCELADA: "muted",
} as const satisfies Record<OccurrenceStatusTokenKey, StatusChipFamily>;

export function getOccurrenceStatusChip(status: OccurrenceStatusTokenKey): StatusChipTone {
  return statusChip[occurrenceStatusTone[status]];
}

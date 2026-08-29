/**
 * Criticidade de ocorrência — spec 0a.1 (PR-0a).
 * Chaves alinhadas a OCCURRENCE_SEVERITIES em @safestop/types (sem dependência).
 */

import { statusChip, type StatusChipFamily, type StatusChipTone } from "./status";

export const occurrenceSeverityKeys = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export type OccurrenceSeverityTokenKey = (typeof occurrenceSeverityKeys)[number];

/**
 * HIGH compartilha `warning` com MEDIUM (override PO 0a.2).
 * Família `primary` fica reservada a identidade/ações/navegação/seleção.
 */
export const occurrenceSeverityTone = {
  LOW: "muted",
  MEDIUM: "warning",
  HIGH: "warning",
  CRITICAL: "destructive",
} as const satisfies Record<OccurrenceSeverityTokenKey, StatusChipFamily>;

export function getOccurrenceSeverityChip(severity: OccurrenceSeverityTokenKey): StatusChipTone {
  return statusChip[occurrenceSeverityTone[severity]];
}

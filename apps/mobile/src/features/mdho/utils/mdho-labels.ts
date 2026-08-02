import type { MdhoCategoryCode } from "@safestop/types";
import { MDHO_CATEGORY_CODES } from "@safestop/types";

export const MDHO_CATEGORY_LABELS: Record<MdhoCategoryCode, string> = {
  BEHAVIOR: "Comportamento",
  DEVIATION_TYPE: "Tipo de Desvio",
  PRECONDITIONS: "Pré-condições",
  ORGANIZATIONAL_ISSUES: "Questões Organizacionais",
  SUPERVISION_INSPECTION: "Supervisão/Fiscalização",
};

export function getMdhoCategoryLabel(code: MdhoCategoryCode): string {
  return MDHO_CATEGORY_LABELS[code];
}

export const MDHO_CATEGORY_STEP_COUNT = MDHO_CATEGORY_CODES.length;

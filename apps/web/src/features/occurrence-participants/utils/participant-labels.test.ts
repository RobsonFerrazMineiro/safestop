import { describe, expect, it } from "vitest";

import type { OccurrenceParticipantType } from "../types";
import {
  getParticipantTypeLabel,
  isParticipantType,
  PARTICIPANT_TYPE_LABELS,
} from "./participant-labels";

const MOBILE_LABELS: Record<OccurrenceParticipantType, string> = {
  REPORTER: "Relator",
  EVALUATOR: "Avaliador",
  CONTRACTOR_LEADER: "Liderança da Contratada",
  CONTRACT_INSPECTOR: "Fiscal do Contrato",
  HSE_SUPERVISOR: "Supervisor HSE",
  HSE_APPROVER: "Aprovador HSE",
  AREA_MANAGER: "Gerente de Área",
  ACTION_OWNER: "Responsável pela ação",
  RELEASE_APPROVER: "Aprovador de liberação",
  OBSERVER: "Observador",
  ACTIVITY_FOREMAN: "Encarregado da atividade",
};

describe("participant-labels", () => {
  it("expõe labels iguais ao Mobile para todos os tipos conhecidos", () => {
    const types = Object.keys(MOBILE_LABELS) as OccurrenceParticipantType[];

    expect(types).toHaveLength(11);

    for (const type of types) {
      expect(isParticipantType(type)).toBe(true);
      expect(getParticipantTypeLabel(type)).toBe(MOBILE_LABELS[type]);
      expect(PARTICIPANT_TYPE_LABELS[type]).toBe(MOBILE_LABELS[type]);
    }
  });

  it("ignora tipo desconhecido sem tratar como participante", () => {
    expect(isParticipantType("UNKNOWN_ROLE")).toBe(false);
    expect(isParticipantType("")).toBe(false);
    expect(isParticipantType("reporter")).toBe(false);
  });
});

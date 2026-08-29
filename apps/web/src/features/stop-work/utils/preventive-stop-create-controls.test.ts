import { describe, expect, it } from "vitest";

import { hasPreventiveStopDraftContent } from "../stores/preventive-stop-draft-store";
import { shouldPromptPreventiveStopCreateLeave } from "./preventive-stop-create-leave";
import {
  EMPTY_ACTIVE_CONTRACTORS_MESSAGE,
  getPreventiveStopCreateControlState,
} from "./preventive-stop-create-controls";

describe("getPreventiveStopCreateControlState — empty de contratada", () => {
  const emptyContractors = getPreventiveStopCreateControlState({
    isCreating: false,
    areasCount: 2,
    contractorsCount: 0,
  });

  it("mantém a mensagem empty visível quando contratadas = []", () => {
    expect(emptyContractors.showEmptyContractorsMessage).toBe(true);
    expect(EMPTY_ACTIVE_CONTRACTORS_MESSAGE).toBe(
      "Nenhuma contratada com contrato ativo nesta organização.",
    );
  });

  it("desabilita somente Contratada e o submit, não os demais campos", () => {
    expect(emptyContractors.isContractorDisabled).toBe(true);
    expect(emptyContractors.isSubmitDisabled).toBe(true);
    expect(emptyContractors.isAreaDisabled).toBe(false);
    expect(emptyContractors.areIndependentFieldsDisabled).toBe(false);
  });

  it("permite conteúdo relevante de rascunho sem Contratada", () => {
    const values = { taskDescription: "Teste de rascunho" };

    expect(hasPreventiveStopDraftContent(values)).toBe(true);
    expect(
      shouldPromptPreventiveStopCreateLeave({
        allowLeave: false,
        values,
      }),
    ).toBe(true);
  });
});

describe("getPreventiveStopCreateControlState — loading/submit e empty de área", () => {
  it("durante isCreating bloqueia controles e submit", () => {
    const state = getPreventiveStopCreateControlState({
      isCreating: true,
      areasCount: 2,
      contractorsCount: 1,
    });

    expect(state.areIndependentFieldsDisabled).toBe(true);
    expect(state.isAreaDisabled).toBe(true);
    expect(state.isContractorDisabled).toBe(true);
    expect(state.isSubmitDisabled).toBe(true);
  });

  it("sem áreas desabilita Área e submit, mas não os campos independentes", () => {
    const state = getPreventiveStopCreateControlState({
      isCreating: false,
      areasCount: 0,
      contractorsCount: 1,
    });

    expect(state.isAreaDisabled).toBe(true);
    expect(state.isSubmitDisabled).toBe(true);
    expect(state.areIndependentFieldsDisabled).toBe(false);
    expect(state.isContractorDisabled).toBe(false);
  });
});

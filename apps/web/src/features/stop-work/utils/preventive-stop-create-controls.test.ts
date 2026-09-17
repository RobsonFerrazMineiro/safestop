import { describe, expect, it } from "vitest";

import {
  DRAFT_SELECT_EMPTY_VALUE,
  EMPTY_ACTIVE_CONTRACTORS_MESSAGE,
  getPreventiveStopCreateControlState,
  resolveDraftSelectValue,
} from "./preventive-stop-create-controls";
import { hasPreventiveStopDraftContent } from "../stores/preventive-stop-draft-store";
import { shouldPromptPreventiveStopCreateLeave } from "./preventive-stop-create-leave";

describe("getPreventiveStopCreateControlState — empty de contrato", () => {
  const emptyContracts = getPreventiveStopCreateControlState({
    isCreating: false,
    areasCount: 2,
    contractsCount: 0,
    hasActiveWorkspace: true,
    allowsOwnTeam: false,
  });

  it("mantém a mensagem empty visível quando contratos = [] e sem equipe própria", () => {
    expect(emptyContracts.showEmptyContractorsMessage).toBe(true);
    expect(EMPTY_ACTIVE_CONTRACTORS_MESSAGE).toBe("Nenhum contrato ativo neste Ambiente.");
  });

  it("desabilita Contrato e o submit quando contrato é obrigatório", () => {
    expect(emptyContracts.isContractorDisabled).toBe(true);
    expect(emptyContracts.isSubmitDisabled).toBe(true);
    expect(emptyContracts.isAreaDisabled).toBe(false);
    expect(emptyContracts.areIndependentFieldsDisabled).toBe(false);
  });

  it("permite conteúdo relevante de rascunho sem Contrato", () => {
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

describe("getPreventiveStopCreateControlState — equipe própria e loading", () => {
  it("durante isCreating bloqueia controles e submit", () => {
    const state = getPreventiveStopCreateControlState({
      isCreating: true,
      areasCount: 2,
      contractsCount: 1,
      hasActiveWorkspace: true,
      allowsOwnTeam: false,
    });

    expect(state.areIndependentFieldsDisabled).toBe(true);
    expect(state.isAreaDisabled).toBe(true);
    expect(state.isContractorDisabled).toBe(true);
    expect(state.isSubmitDisabled).toBe(true);
  });

  it("owner com equipe própria pode submeter sem contratos listados", () => {
    const state = getPreventiveStopCreateControlState({
      isCreating: false,
      areasCount: 2,
      contractsCount: 0,
      hasActiveWorkspace: true,
      allowsOwnTeam: true,
    });

    expect(state.isSubmitDisabled).toBe(false);
    expect(state.isContractorDisabled).toBe(false);
    expect(state.showEmptyContractorsMessage).toBe(false);
  });

  it("sem Ambiente ativo bloqueia submit e campos", () => {
    const state = getPreventiveStopCreateControlState({
      isCreating: false,
      areasCount: 2,
      contractsCount: 1,
      hasActiveWorkspace: false,
      allowsOwnTeam: true,
    });

    expect(state.isSubmitDisabled).toBe(true);
    expect(state.areIndependentFieldsDisabled).toBe(true);
    expect(state.isAreaDisabled).toBe(true);
    expect(state.isContractorDisabled).toBe(true);
  });
});

describe("resolveDraftSelectValue — Select sempre controlado", () => {
  it("nunca devolve undefined; vazio usa sentinel", () => {
    expect(resolveDraftSelectValue("")).toBe(DRAFT_SELECT_EMPTY_VALUE);
    expect(resolveDraftSelectValue("ctr-1")).toBe("ctr-1");
  });
});

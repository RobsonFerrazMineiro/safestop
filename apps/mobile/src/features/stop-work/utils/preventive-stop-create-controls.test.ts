import { describe, expect, it } from "vitest";

import {
  EMPTY_ACTIVE_CONTRACTORS_MESSAGE,
  getPreventiveStopCreateControlState,
} from "./preventive-stop-create-controls";

describe("getPreventiveStopCreateControlState — empty de contrato", () => {
  const emptyContracts = getPreventiveStopCreateControlState({
    isCreating: false,
    isOffline: false,
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
});

describe("getPreventiveStopCreateControlState — equipe própria e loading", () => {
  it("durante isCreating bloqueia controles e submit", () => {
    const state = getPreventiveStopCreateControlState({
      isCreating: true,
      isOffline: false,
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
      isOffline: false,
      areasCount: 2,
      contractsCount: 0,
      hasActiveWorkspace: true,
      allowsOwnTeam: true,
    });

    expect(state.isSubmitDisabled).toBe(false);
    expect(state.isContractorDisabled).toBe(false);
    expect(state.showEmptyContractorsMessage).toBe(false);
  });

  it("não-owner offline não submete", () => {
    const state = getPreventiveStopCreateControlState({
      isCreating: false,
      isOffline: true,
      areasCount: 2,
      contractsCount: 1,
      hasActiveWorkspace: true,
      allowsOwnTeam: false,
    });

    expect(state.isSubmitDisabled).toBe(true);
  });

  it("sem Ambiente ativo bloqueia submit e campos", () => {
    const state = getPreventiveStopCreateControlState({
      isCreating: false,
      isOffline: false,
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

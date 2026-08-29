import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearStoredPreventiveStopDraft,
  getPreventiveStopDraftStorageKey,
  getStoredPreventiveStopDraft,
  hasPreventiveStopDraftContent,
  parseStoredPreventiveStopDraft,
  setStoredPreventiveStopDraft,
} from "./preventive-stop-draft-store";

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();

  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.get(key) ?? null;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
  };
}

const USER_A = "user-a";
const USER_B = "user-b";
const ORG_A = "org-a";
const ORG_B = "org-b";

describe("hasPreventiveStopDraftContent", () => {
  it("é false para formulário vazio com severity MEDIUM isolada", () => {
    expect(
      hasPreventiveStopDraftContent({
        taskDescription: "",
        locationDescription: "",
        conditionDescription: "",
        immediateActionDescription: "",
        severity: "MEDIUM",
        areaId: "",
        contractorOrganizationId: "",
      }),
    ).toBe(false);
  });

  it("é false quando só há strings em branco e MEDIUM", () => {
    expect(hasPreventiveStopDraftContent({ severity: "MEDIUM" })).toBe(false);
    expect(hasPreventiveStopDraftContent({})).toBe(false);
  });

  it("é true quando um campo relevante possui conteúdo", () => {
    expect(hasPreventiveStopDraftContent({ taskDescription: "Solda em altura" })).toBe(true);
    expect(hasPreventiveStopDraftContent({ locationDescription: "Galpão 2" })).toBe(true);
    expect(hasPreventiveStopDraftContent({ severity: "HIGH" })).toBe(true);
  });
});

describe("preventive-stop-draft-store", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("isola a chave por userId e organizationId", () => {
    expect(getPreventiveStopDraftStorageKey(USER_A, ORG_A)).toBe(
      `safestop:preventiveStopDraft:${USER_A}:${ORG_A}`,
    );
    expect(getPreventiveStopDraftStorageKey(USER_A, ORG_A)).not.toBe(
      getPreventiveStopDraftStorageKey(USER_A, ORG_B),
    );
    expect(getPreventiveStopDraftStorageKey(USER_A, ORG_A)).not.toBe(
      getPreventiveStopDraftStorageKey(USER_B, ORG_A),
    );
  });

  it("persiste e restaura um draft válido no mesmo escopo", () => {
    setStoredPreventiveStopDraft(USER_A, ORG_A, {
      taskDescription: "Atividade",
      severity: "HIGH",
    });

    expect(getStoredPreventiveStopDraft(USER_A, ORG_A)).toEqual({
      taskDescription: "Atividade",
      severity: "HIGH",
    });
    expect(getStoredPreventiveStopDraft(USER_A, ORG_B)).toBeNull();
    expect(getStoredPreventiveStopDraft(USER_B, ORG_A)).toBeNull();
  });

  it("não persiste formulário vazio + MEDIUM e remove chave existente", () => {
    setStoredPreventiveStopDraft(USER_A, ORG_A, { taskDescription: "Atividade" });
    setStoredPreventiveStopDraft(USER_A, ORG_A, { severity: "MEDIUM", taskDescription: "  " });

    expect(getStoredPreventiveStopDraft(USER_A, ORG_A)).toBeNull();
    expect(localStorage.getItem(getPreventiveStopDraftStorageKey(USER_A, ORG_A))).toBeNull();
  });

  it("remove o draft com clear", () => {
    setStoredPreventiveStopDraft(USER_A, ORG_A, { locationDescription: "Pátio" });
    clearStoredPreventiveStopDraft(USER_A, ORG_A);

    expect(getStoredPreventiveStopDraft(USER_A, ORG_A)).toBeNull();
  });

  it("ignora JSON inválido", () => {
    localStorage.setItem(getPreventiveStopDraftStorageKey(USER_A, ORG_A), "{not-json");

    expect(getStoredPreventiveStopDraft(USER_A, ORG_A)).toBeNull();
  });

  it("ignora envelope incompatível ou data corrompida", () => {
    localStorage.setItem(
      getPreventiveStopDraftStorageKey(USER_A, ORG_A),
      JSON.stringify({ version: 99, data: { taskDescription: "x" } }),
    );
    expect(getStoredPreventiveStopDraft(USER_A, ORG_A)).toBeNull();

    localStorage.setItem(
      getPreventiveStopDraftStorageKey(USER_A, ORG_A),
      JSON.stringify({ version: 1, data: ["x"] }),
    );
    expect(getStoredPreventiveStopDraft(USER_A, ORG_A)).toBeNull();
  });

  it("hidrata apenas campos válidos quando parte do payload está corrompida", () => {
    localStorage.setItem(
      getPreventiveStopDraftStorageKey(USER_A, ORG_A),
      JSON.stringify({
        version: 1,
        updatedAt: "2026-08-27T00:00:00.000Z",
        data: {
          taskDescription: "Atividade",
          locationDescription: 12,
          severity: "NOPE",
        },
      }),
    );

    expect(getStoredPreventiveStopDraft(USER_A, ORG_A)).toEqual({
      taskDescription: "Atividade",
    });
  });

  it("não propaga exception quando a leitura do localStorage falha", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("SecurityError");
      },
      setItem() {
        return undefined;
      },
      removeItem() {
        return undefined;
      },
    });

    expect(() => getStoredPreventiveStopDraft(USER_A, ORG_A)).not.toThrow();
    expect(getStoredPreventiveStopDraft(USER_A, ORG_A)).toBeNull();
  });

  it("não propaga exception quando a escrita do localStorage falha", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        return null;
      },
      setItem() {
        throw new Error("QuotaExceededError");
      },
      removeItem() {
        return undefined;
      },
    });

    expect(() =>
      setStoredPreventiveStopDraft(USER_A, ORG_A, { taskDescription: "Atividade" }),
    ).not.toThrow();
  });

  it("não propaga exception quando a remoção do localStorage falha", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        return null;
      },
      setItem() {
        return undefined;
      },
      removeItem() {
        throw new Error("SecurityError");
      },
    });

    expect(() => clearStoredPreventiveStopDraft(USER_A, ORG_A)).not.toThrow();
  });

  it("tolera localStorage indisponível", () => {
    vi.stubGlobal("localStorage", undefined);

    expect(() => getStoredPreventiveStopDraft(USER_A, ORG_A)).not.toThrow();
    expect(getStoredPreventiveStopDraft(USER_A, ORG_A)).toBeNull();
    expect(() =>
      setStoredPreventiveStopDraft(USER_A, ORG_A, { taskDescription: "Atividade" }),
    ).not.toThrow();
    expect(() => clearStoredPreventiveStopDraft(USER_A, ORG_A)).not.toThrow();
  });
});

describe("parseStoredPreventiveStopDraft", () => {
  it("retorna null para JSON inválido", () => {
    expect(parseStoredPreventiveStopDraft("not-json")).toBeNull();
  });
});

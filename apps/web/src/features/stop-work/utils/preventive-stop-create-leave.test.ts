import { describe, expect, it } from "vitest";

import {
  isInternalPreventiveStopCreateExit,
  resolveCreateLeaveConfirmAction,
  resolveCreatePopStateAction,
  shouldPromptPreventiveStopCreateLeave,
} from "./preventive-stop-create-leave";

const ORIGIN = "http://localhost:3000";

describe("shouldPromptPreventiveStopCreateLeave", () => {
  it("não abre diálogo para formulário vazio + MEDIUM", () => {
    expect(
      shouldPromptPreventiveStopCreateLeave({
        allowLeave: false,
        values: { severity: "MEDIUM", taskDescription: "" },
      }),
    ).toBe(false);
  });

  it("abre diálogo quando há conteúdo relevante", () => {
    expect(
      shouldPromptPreventiveStopCreateLeave({
        allowLeave: false,
        values: { taskDescription: "Atividade" },
      }),
    ).toBe(true);
  });

  it("não abre diálogo após allowLeave (submit/redirect)", () => {
    expect(
      shouldPromptPreventiveStopCreateLeave({
        allowLeave: true,
        values: { taskDescription: "Atividade" },
      }),
    ).toBe(false);
  });
});

describe("isInternalPreventiveStopCreateExit", () => {
  it("intercepta link interno que sai de /stop-work/new", () => {
    expect(isInternalPreventiveStopCreateExit("/stop-work", ORIGIN)).toBe(true);
    expect(isInternalPreventiveStopCreateExit("/dashboard", ORIGIN)).toBe(true);
  });

  it("não intercepta a própria rota de criação nem origem externa", () => {
    expect(isInternalPreventiveStopCreateExit("/stop-work/new", ORIGIN)).toBe(false);
    expect(isInternalPreventiveStopCreateExit("https://example.com/", ORIGIN)).toBe(false);
  });
});

describe("resolveCreatePopStateAction", () => {
  it("permite Back/Forward quando o formulário está vazio", () => {
    expect(
      resolveCreatePopStateAction({
        allowLeave: false,
        isRestoringGuard: false,
        hasRelevantContent: false,
      }),
    ).toBe("allow");
  });

  it("restaura e pede confirmação quando há conteúdo", () => {
    expect(
      resolveCreatePopStateAction({
        allowLeave: false,
        isRestoringGuard: false,
        hasRelevantContent: true,
      }),
    ).toBe("restore-and-prompt");
  });

  it("ignora o popstate de restauração para não criar loop", () => {
    expect(
      resolveCreatePopStateAction({
        allowLeave: false,
        isRestoringGuard: true,
        hasRelevantContent: true,
      }),
    ).toBe("ignore");
  });

  it("não bloqueia após submit bem-sucedido", () => {
    expect(
      resolveCreatePopStateAction({
        allowLeave: true,
        isRestoringGuard: false,
        hasRelevantContent: true,
      }),
    ).toBe("ignore");
  });
});

describe("resolveCreateLeaveConfirmAction", () => {
  it("faz flush implícito via history-back quando a saída veio do browser", () => {
    expect(
      resolveCreateLeaveConfirmAction({
        isHistoryLeave: true,
        pendingHref: "/dashboard",
      }),
    ).toEqual({ type: "history-back" });
  });

  it("navega para o href pendente após Salvar e sair em link interno", () => {
    expect(
      resolveCreateLeaveConfirmAction({
        isHistoryLeave: false,
        pendingHref: "/stop-work",
      }),
    ).toEqual({ type: "push", href: "/stop-work" });
  });
});

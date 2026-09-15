import { describe, expect, it } from "vitest";

import { ACTION_ITEM_ATTACHMENT_MAX_COUNT } from "../types";
import { ACTION_PLAN_COPY } from "./action-plan-copy";
import {
  countCompletedActionItemAttachments,
  formatEvidenceCounter,
  getActionItemEvidenceSubmitError,
  getAttachmentListRefreshError,
  requiresActionItemEvidence,
} from "./action-plan-evidence-rules";

describe("requiresActionItemEvidence", () => {
  it("LOW não exige evidência", () => {
    expect(requiresActionItemEvidence("LOW")).toBe(false);
  });

  it("MEDIUM não exige evidência", () => {
    expect(requiresActionItemEvidence("MEDIUM")).toBe(false);
  });

  it("HIGH exige evidência", () => {
    expect(requiresActionItemEvidence("HIGH")).toBe(true);
  });

  it("CRITICAL exige evidência", () => {
    expect(requiresActionItemEvidence("CRITICAL")).toBe(true);
  });
});

describe("getActionItemEvidenceSubmitError", () => {
  it("MEDIUM com completedCount 0 não gera evidenceRequiredError", () => {
    expect(getActionItemEvidenceSubmitError("MEDIUM", 0)).toBeNull();
  });

  it("LOW com completedCount 0 não gera evidenceRequiredError", () => {
    expect(getActionItemEvidenceSubmitError("LOW", 0)).toBeNull();
  });

  it("HIGH com completedCount 0 gera evidenceRequiredError", () => {
    expect(getActionItemEvidenceSubmitError("HIGH", 0)).toBe(
      ACTION_PLAN_COPY.evidenceRequiredError,
    );
  });

  it("HIGH com completedCount 1 satisfaz validação", () => {
    expect(getActionItemEvidenceSubmitError("HIGH", 1)).toBeNull();
  });

  it("CRITICAL com completedCount 0 gera evidenceRequiredError", () => {
    expect(getActionItemEvidenceSubmitError("CRITICAL", 0)).toBe(
      ACTION_PLAN_COPY.evidenceRequiredError,
    );
  });

  it("CRITICAL com completedCount 1 satisfaz validação", () => {
    expect(getActionItemEvidenceSubmitError("CRITICAL", 1)).toBeNull();
  });
});

describe("countCompletedActionItemAttachments / contador 0→1", () => {
  it("0 COMPLETED → 0/20", () => {
    const completed = countCompletedActionItemAttachments([
      { uploadStatus: "PENDING" },
      { uploadStatus: "FAILED" },
    ]);

    expect(completed).toBe(0);
    expect(formatEvidenceCounter(completed, ACTION_ITEM_ATTACHMENT_MAX_COUNT)).toBe(
      "0/20 evidências",
    );
  });

  it("após upload PDF COMPLETED → 1/20", () => {
    const before = countCompletedActionItemAttachments([]);
    expect(before).toBe(0);

    const afterUploadRefetch = countCompletedActionItemAttachments([
      {
        uploadStatus: "COMPLETED",
      },
    ]);

    expect(afterUploadRefetch).toBe(1);
    expect(formatEvidenceCounter(afterUploadRefetch, ACTION_ITEM_ATTACHMENT_MAX_COUNT)).toBe(
      "1/20 evidências",
    );
  });

  it("PENDING não incrementa o contador", () => {
    expect(countCompletedActionItemAttachments([{ uploadStatus: "PENDING" }])).toBe(0);
  });
});

describe("getAttachmentListRefreshError", () => {
  it("vazio legítimo (error=null) não gera erro de lista", () => {
    expect(getAttachmentListRefreshError({ error: null })).toBeNull();
  });

  it("refetch ERROR após upload COMPLETED → copy de lista, sem reupload", () => {
    const message = getAttachmentListRefreshError({
      error: new Error("Não foi possível carregar as evidências da ação."),
    });

    expect(message).toBe(ACTION_PLAN_COPY.evidenceListRefreshError);
    expect(message).not.toMatch(/falha no upload/i);
  });
});

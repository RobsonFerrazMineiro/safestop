import { describe, expect, it } from "vitest";
import {
  ACTION_ITEM_ATTACHMENT_MIME_TYPES,
  OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  OCCURRENCE_ATTACHMENT_MIME_TYPES,
} from "@safestop/types";

import { prepareAttachmentUploadSchema } from "./occurrence-attachment";

const basePayload = {
  occurrenceId: "b0000000-0000-4000-8000-000000000001",
  attachmentType: "INITIAL_EVIDENCE" as const,
  originalFileName: "evidencia.pdf",
  mimeType: "application/pdf" as const,
  fileSize: 1024,
};

describe("prepareAttachmentUploadSchema — MIME allowlist (imagens + PDF)", () => {
  it.each([...OCCURRENCE_ATTACHMENT_MIME_TYPES] as const)("aceita mimeType %s", (mimeType) => {
    const result = prepareAttachmentUploadSchema.safeParse({
      ...basePayload,
      mimeType,
      originalFileName: mimeType === "application/pdf" ? "evidencia.pdf" : "evidencia.jpg",
    });

    expect(result.success).toBe(true);
  });

  it("aceita PDF válido dentro do limite de 10 MiB", () => {
    const result = prepareAttachmentUploadSchema.safeParse({
      ...basePayload,
      mimeType: "application/pdf",
      fileSize: OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
    });

    expect(result.success).toBe(true);
  });

  it("rejeita MIME inválido com copy genérica de arquivo (não 'imagem')", () => {
    const result = prepareAttachmentUploadSchema.safeParse({
      ...basePayload,
      mimeType: "text/plain",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues.map((issue) => issue.message).join(" ");
      expect(message).toContain("Formato de arquivo não suportado.");
      expect(message.toLowerCase()).not.toContain("imagem");
    }
  });

  it("rejeita application/octet-stream", () => {
    const result = prepareAttachmentUploadSchema.safeParse({
      ...basePayload,
      mimeType: "application/octet-stream",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita arquivo acima de 10 MiB", () => {
    const result = prepareAttachmentUploadSchema.safeParse({
      ...basePayload,
      fileSize: OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES + 1,
    });

    expect(result.success).toBe(false);
  });

  it("rejeita tamanho inválido (<= 0)", () => {
    expect(prepareAttachmentUploadSchema.safeParse({ ...basePayload, fileSize: 0 }).success).toBe(
      false,
    );
    expect(prepareAttachmentUploadSchema.safeParse({ ...basePayload, fileSize: -1 }).success).toBe(
      false,
    );
  });
});

describe("paridade occurrence × action item MIME (validation gate)", () => {
  it("ACTION_ITEM_ATTACHMENT_MIME_TYPES espelha OCCURRENCE_ATTACHMENT_MIME_TYPES", () => {
    expect([...ACTION_ITEM_ATTACHMENT_MIME_TYPES]).toEqual([...OCCURRENCE_ATTACHMENT_MIME_TYPES]);
    expect(ACTION_ITEM_ATTACHMENT_MIME_TYPES).toContain("application/pdf");
  });
});

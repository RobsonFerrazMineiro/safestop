import { describe, expect, it } from "vitest";

import {
  ACTION_ITEM_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  ACTION_ITEM_ATTACHMENT_MIME_TYPES,
} from "./action-plan";
import {
  OCCURRENCE_ATTACHMENT_MAX_COUNT_PER_OCCURRENCE,
  OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  OCCURRENCE_ATTACHMENT_MIME_TYPES,
  isOccurrenceAttachmentMimeType,
} from "./occurrence-attachment";

describe("OCCURRENCE_ATTACHMENT_MIME_TYPES", () => {
  it.each(["image/jpeg", "image/png", "image/webp", "application/pdf"] as const)(
    "permite %s",
    (mime) => {
      expect(OCCURRENCE_ATTACHMENT_MIME_TYPES).toContain(mime);
      expect(isOccurrenceAttachmentMimeType(mime)).toBe(true);
    },
  );

  it.each(["text/plain", "application/octet-stream", "image/heic", "image/heif"] as const)(
    "rejeita %s",
    (mime) => {
      expect(OCCURRENCE_ATTACHMENT_MIME_TYPES).not.toContain(mime);
      expect(isOccurrenceAttachmentMimeType(mime)).toBe(false);
    },
  );

  it("preserva limite de 10 MiB e max count 20", () => {
    expect(OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES).toBe(10_485_760);
    expect(OCCURRENCE_ATTACHMENT_MAX_COUNT_PER_OCCURRENCE).toBe(20);
  });
});

describe("ACTION_ITEM_ATTACHMENT_MIME_TYPES", () => {
  it("permanece alinhado à allowlist de occurrence attachments", () => {
    expect([...ACTION_ITEM_ATTACHMENT_MIME_TYPES]).toEqual([...OCCURRENCE_ATTACHMENT_MIME_TYPES]);
  });

  it.each(["image/jpeg", "image/png", "image/webp", "application/pdf"] as const)(
    "permite %s",
    (mime) => {
      expect(ACTION_ITEM_ATTACHMENT_MIME_TYPES).toContain(mime);
    },
  );

  it.each(["text/plain", "application/octet-stream"] as const)("rejeita %s", (mime) => {
    expect(ACTION_ITEM_ATTACHMENT_MIME_TYPES).not.toContain(mime);
  });

  it("preserva limite de 10 MiB", () => {
    expect(ACTION_ITEM_ATTACHMENT_MAX_FILE_SIZE_BYTES).toBe(10_485_760);
    expect(ACTION_ITEM_ATTACHMENT_MAX_FILE_SIZE_BYTES).toBe(
      OCCURRENCE_ATTACHMENT_MAX_FILE_SIZE_BYTES,
    );
  });
});

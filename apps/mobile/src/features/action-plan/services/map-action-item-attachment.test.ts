import { describe, expect, it } from "vitest";

import { mapActionItemAttachmentRow } from "./map-action-plan";
import { ACTION_ITEM_ATTACHMENTS_SELECT } from "./action-item-attachments-select";

describe("ACTION_ITEM_ATTACHMENTS_SELECT", () => {
  it("consulta uploaded_by e não created_by", () => {
    expect(ACTION_ITEM_ATTACHMENTS_SELECT).toContain("uploaded_by");
    expect(ACTION_ITEM_ATTACHMENTS_SELECT).not.toContain("created_by");
  });
});

describe("mapActionItemAttachmentRow", () => {
  const baseRow = {
    id: "att-1",
    action_item_id: "item-1",
    organization_id: "org-1",
    storage_bucket: "occurrence-evidence",
    storage_path: "org-1/action-items/item-1/att-1.pdf",
    original_file_name: "laudo.pdf",
    upload_status: "COMPLETED",
    mime_type: "application/pdf",
    file_size: 1_304_295,
    caption: null,
    created_at: "2026-09-07T12:00:00.000Z",
    uploaded_by: "user-1",
  };

  it("mapeia PDF COMPLETED e createdBy ← uploaded_by", () => {
    const mapped = mapActionItemAttachmentRow(baseRow);

    expect(mapped).not.toBeNull();
    expect(mapped?.mimeType).toBe("application/pdf");
    expect(mapped?.uploadStatus).toBe("COMPLETED");
    expect(mapped?.createdBy).toBe("user-1");
    expect(mapped?.originalFileName).toBe("laudo.pdf");
  });

  it("mapeia imagem JPEG COMPLETED", () => {
    const mapped = mapActionItemAttachmentRow({
      ...baseRow,
      id: "att-2",
      original_file_name: "foto.jpg",
      mime_type: "image/jpeg",
      storage_path: "org-1/action-items/item-1/att-2.jpg",
      file_size: 90_000,
    });

    expect(mapped).not.toBeNull();
    expect(mapped?.mimeType).toBe("image/jpeg");
    expect(mapped?.uploadStatus).toBe("COMPLETED");
    expect(mapped?.createdBy).toBe("user-1");
  });

  it("descarta MIME inválido", () => {
    expect(
      mapActionItemAttachmentRow({
        ...baseRow,
        mime_type: "application/octet-stream",
      }),
    ).toBeNull();
  });
});

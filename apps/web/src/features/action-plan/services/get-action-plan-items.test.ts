import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ACTION_PLAN_ITEMS_SELECT,
  mapActionItemRow,
  type ActionItemRow,
} from "./get-action-plan-items";

describe("ACTION_PLAN_ITEMS_SELECT", () => {
  it("usa a FK real action_items_responsible_member_org_fk", () => {
    expect(ACTION_PLAN_ITEMS_SELECT).toContain(
      "organization_members!action_items_responsible_member_org_fk",
    );
    expect(ACTION_PLAN_ITEMS_SELECT).not.toContain("action_items_responsible_member_id_fkey");
  });

  it("embute profiles via profile_id (contrato Mobile)", () => {
    expect(ACTION_PLAN_ITEMS_SELECT).toContain("profiles:profile_id");
  });

  it("fonte do service referencia o select exportado", () => {
    const source = readFileSync(resolve(__dirname, "./get-action-plan-items.ts"), "utf8");
    expect(source).toContain(".select(ACTION_PLAN_ITEMS_SELECT)");
  });
});

describe("mapActionItemRow", () => {
  const baseRow: ActionItemRow = {
    id: "12100000-0000-4000-8000-000000000001",
    action_plan_id: "12000000-0000-4000-8000-000000000009",
    organization_id: "b1000000-0000-4000-8000-000000000001",
    title: "Reinstalar grade de proteção do agitador",
    description: "Descrição",
    responsible_member_id: "c0000000-0000-4000-8000-000000000001",
    responsible_organization_id: "b1000000-0000-4000-8000-000000000001",
    due_at: "2026-09-15T12:00:00.000Z",
    priority: "HIGH",
    status: "AWAITING_VALIDATION",
    completion_description: null,
    completed_at: null,
    completed_by: null,
    validated_at: null,
    validated_by: null,
    validation_note: null,
    created_at: "2026-09-01T12:00:00.000Z",
    updated_at: "2026-09-01T12:00:00.000Z",
    responsible_member: {
      profiles: { full_name: "Responsável QA" },
    },
    responsible_organization: { name: "Hydro QA" },
    completed_by_profile: null,
  };

  it("mapeia ações retornadas com responsável e status", () => {
    const mapped = mapActionItemRow(baseRow);

    expect(mapped).not.toBeNull();
    expect(mapped?.id).toBe(baseRow.id);
    expect(mapped?.status).toBe("AWAITING_VALIDATION");
    expect(mapped?.priority).toBe("HIGH");
    expect(mapped?.title).toBe(baseRow.title);
    expect(mapped?.dueAt).toBe(baseRow.due_at);
    expect(mapped?.description).toBe("Descrição");
    expect(mapped?.responsibleMemberName).toBe("Responsável QA");
    expect(mapped?.responsibleOrganizationName).toBe("Hydro QA");
  });

  it("descarta status/prioridade inválidos", () => {
    expect(mapActionItemRow({ ...baseRow, status: "NOPE" })).toBeNull();
    expect(mapActionItemRow({ ...baseRow, priority: "NOPE" })).toBeNull();
  });
});

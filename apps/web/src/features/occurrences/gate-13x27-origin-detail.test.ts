import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { OCCURRENCE_DETAIL_SELECT } from "@/features/occurrences/services/get-occurrences";
import { mapOccurrenceDetailRow } from "@/features/occurrences/utils/map-occurrence";
import { buildOccurrenceDetailLookup } from "@/features/occurrences/utils/workspace-create-rules";
import {
  DRAFT_SELECT_EMPTY_VALUE,
  resolveDraftSelectValue,
} from "@/features/stop-work/utils/preventive-stop-create-controls";

describe("Gate 13X.2.7 — detalhe origin + Select controlado", () => {
  it("getOccurrence / DETAIL_SELECT contém areas( e não filtra organization_id no detalhe", () => {
    expect(OCCURRENCE_DETAIL_SELECT).toMatch(/areas(!occurrences_area_id_fkey)?\s*\(/);
    expect(buildOccurrenceDetailLookup("65cfed0c-76d5-443d-9f34-06f75aab671f")).toEqual({
      occurrenceId: "65cfed0c-76d5-443d-9f34-06f75aab671f",
      filterByActingOrganization: false,
    });

    const source = readFileSync(
      resolve(process.cwd(), "src/features/occurrences/services/get-occurrences.ts"),
      "utf8",
    );
    const detailFn = source.slice(source.indexOf("export async function getOccurrence("));
    expect(detailFn).toContain('.eq("id", lookup.occurrenceId)');
    expect(detailFn).not.toMatch(/\.eq\("organization_id"/);
  });

  it("mapper não dropa o detalhe quando o nome da contratada vem nulo", () => {
    const mapped = mapOccurrenceDetailRow({
      id: "65cfed0c-76d5-443d-9f34-06f75aab671f",
      public_code: "SS-26-000134",
      title: "PP originada",
      status: "EM_AVALIACAO",
      severity: "HIGH",
      created_at: "2026-01-01T00:00:00.000Z",
      area_id: "area-1",
      unit_id: null,
      contract_id: "ctr-1",
      management_department_id: null,
      workspace_id: "ws-hydro",
      origin_organization_id: "org-tuv",
      task_description: "Atividade",
      location_description: "Local",
      condition_description: "Condição",
      immediate_action_description: null,
      decision_type: null,
      latitude: null,
      longitude: null,
      location_accuracy: null,
      occurred_at: "2026-01-01T00:00:00.000Z",
      stopped_at: null,
      organization_id: "org-hydro",
      contractor_organization_id: "org-kw",
      created_by: "user-1",
      evaluated_at: null,
      released_at: null,
      closed_at: null,
      cancelled_at: null,
      ims_reference_code: null,
      ims_reference_registered_at: null,
      ims_reference_registered_by: null,
      ims_reference_updated_at: null,
      ims_reference_updated_by: null,
      assigned_evaluator_id: null,
      evaluator: null,
      ims_registered_by_profile: null,
      ims_updated_by_profile: null,
      occurrence_decisions: null,
      areas: { name: "Clarificação" },
      profiles: { full_name: "Operador" },
      contractor_organizations: null,
      origin_organizations: { name: "TÜV" },
    });

    expect(mapped).not.toBeNull();
    expect(mapped?.id).toBe("65cfed0c-76d5-443d-9f34-06f75aab671f");
    expect(mapped?.publicCode).toBe("SS-26-000134");
    expect(mapped?.contractorOrganizationName).toBeNull();
    expect(mapped?.originOrganizationName).toBe("TÜV");
  });

  it("DraftSelectControl resolve value sempre definido (sentinel, não undefined)", () => {
    expect(resolveDraftSelectValue("")).toBe(DRAFT_SELECT_EMPTY_VALUE);
    expect(resolveDraftSelectValue("area-1")).toBe("area-1");
    expect(resolveDraftSelectValue("")).not.toBeUndefined();
    expect(typeof resolveDraftSelectValue("")).toBe("string");

    const create = readFileSync(
      resolve(process.cwd(), "src/features/stop-work/components/stop-work-create-container.tsx"),
      "utf8",
    );
    expect(create).toContain("value={resolveDraftSelectValue(value)}");
    expect(create).not.toContain("value || undefined");
  });
});

import {
  isMdhoAssessmentStatus,
  isMdhoCategoryCode,
  type MdhoAssessment,
  type MdhoCatalog,
  type MdhoCatalogCategory,
  type MdhoCatalogOption,
  type MdhoSelection,
} from "@safestop/types";

import type { MdhoAssessmentEnriched } from "../types";

type ProfileJoin = { full_name: string | null };

type SelectionRow = {
  id: string;
  category_id: string;
  option_id: string;
  detail: string | null;
  created_at: string;
  created_by: string;
};

type AssessmentRow = {
  id: string;
  occurrence_id: string;
  organization_id: string;
  status: string;
  complement: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  returned_at: string | null;
  returned_by: string | null;
  return_reason: string | null;
  created_at: string;
  updated_at: string;
  mdho_selections: SelectionRow | SelectionRow[] | null;
  submitted_by_profile?: ProfileJoin | ProfileJoin[] | null;
  approved_by_profile?: ProfileJoin | ProfileJoin[] | null;
  returned_by_profile?: ProfileJoin | ProfileJoin[] | null;
};

function normalizeJoin<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function mapSelection(row: SelectionRow): MdhoSelection {
  return {
    id: row.id,
    categoryId: row.category_id,
    optionId: row.option_id,
    detail: row.detail,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export function mapMdhoAssessmentRow(row: AssessmentRow): MdhoAssessmentEnriched | null {
  if (!isMdhoAssessmentStatus(row.status)) {
    return null;
  }

  const selectionsRaw = normalizeJoin(row.mdho_selections);
  const selections = Array.isArray(row.mdho_selections)
    ? row.mdho_selections.map(mapSelection)
    : selectionsRaw
      ? [mapSelection(selectionsRaw)]
      : [];

  const submittedProfile = normalizeJoin(row.submitted_by_profile);
  const approvedProfile = normalizeJoin(row.approved_by_profile);
  const returnedProfile = normalizeJoin(row.returned_by_profile);

  const assessment: MdhoAssessment = {
    id: row.id,
    occurrenceId: row.occurrence_id,
    organizationId: row.organization_id,
    status: row.status,
    complement: row.complement,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    returnedAt: row.returned_at,
    returnedBy: row.returned_by,
    returnReason: row.return_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    selections,
  };

  return {
    ...assessment,
    submittedByName: submittedProfile?.full_name ?? null,
    approvedByName: approvedProfile?.full_name ?? null,
    returnedByName: returnedProfile?.full_name ?? null,
  };
}

type OptionRow = {
  id: string;
  category_id: string;
  code: string;
  label: string;
  allows_detail: boolean;
  display_order: number;
  is_active: boolean;
};

type CategoryRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  allows_multiple: boolean;
  requires_selection: boolean;
  display_order: number;
  is_active: boolean;
  mdho_options: OptionRow | OptionRow[] | null;
};

function mapOption(row: OptionRow): MdhoCatalogOption | null {
  if (!row.is_active) {
    return null;
  }

  return {
    id: row.id,
    categoryId: row.category_id,
    code: row.code,
    label: row.label,
    allowsDetail: row.allows_detail,
    displayOrder: row.display_order,
  };
}

function mapCategory(row: CategoryRow): MdhoCatalogCategory | null {
  if (!row.is_active || !isMdhoCategoryCode(row.code)) {
    return null;
  }

  const optionsRaw = row.mdho_options;
  const options = (Array.isArray(optionsRaw) ? optionsRaw : optionsRaw ? [optionsRaw] : [])
    .map(mapOption)
    .filter((option): option is MdhoCatalogOption => option !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    allowsMultiple: row.allows_multiple,
    requiresSelection: row.requires_selection,
    displayOrder: row.display_order,
    options,
  };
}

export function mapMdhoCatalogRows(rows: CategoryRow[]): MdhoCatalog {
  const categories = rows
    .map(mapCategory)
    .filter((category): category is MdhoCatalogCategory => category !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return { categories };
}

export type { AssessmentRow, CategoryRow };

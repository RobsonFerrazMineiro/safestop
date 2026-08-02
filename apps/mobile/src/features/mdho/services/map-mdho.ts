import {
  isMdhoAssessmentStatus,
  isMdhoCategoryCode,
  isOccurrenceStatus,
  type ApproveMdhoAssessmentResult,
  type MdhoAssessment,
  type MdhoCatalog,
  type MdhoCatalogCategory,
  type MdhoSelection,
  type ReturnMdhoAssessmentResult,
  type SaveMdhoDraftResult,
  type StartMdhoAssessmentResult,
  type SubmitMdhoAssessmentResult,
} from "@safestop/types";

type RpcAssessmentRow = {
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
  mdho_selections?: RpcSelectionRow | RpcSelectionRow[] | null;
  submitter?: ProfileJoin;
  approver?: ProfileJoin;
  returner?: ProfileJoin;
};

type RpcSelectionRow = {
  id: string;
  category_id: string;
  option_id: string;
  detail: string | null;
  created_at: string;
  created_by: string;
};

type ProfileJoin = { full_name: string | null } | { full_name: string | null }[] | null;

type RpcCategoryRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  allows_multiple: boolean;
  requires_selection: boolean;
  display_order: number;
  mdho_options: RpcOptionRow | RpcOptionRow[] | null;
};

type RpcOptionRow = {
  id: string;
  category_id: string;
  code: string;
  label: string;
  allows_detail: boolean;
  display_order: number;
};

function resolveJoin<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function resolveProfileName(value: ProfileJoin): string | null {
  const profile = resolveJoin(value);
  return profile?.full_name ?? null;
}

export function mapMdhoSelection(row: RpcSelectionRow): MdhoSelection {
  return {
    id: row.id,
    categoryId: row.category_id,
    optionId: row.option_id,
    detail: row.detail,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export type MdhoAssessmentEnriched = MdhoAssessment & {
  submittedByName: string | null;
  approvedByName: string | null;
  returnedByName: string | null;
};

export function mapMdhoAssessmentRow(row: RpcAssessmentRow): MdhoAssessmentEnriched | null {
  if (!isMdhoAssessmentStatus(row.status)) {
    return null;
  }

  const selectionsRaw = resolveJoin(row.mdho_selections);
  const selections = Array.isArray(row.mdho_selections)
    ? row.mdho_selections.map(mapMdhoSelection)
    : selectionsRaw
      ? [mapMdhoSelection(selectionsRaw)]
      : [];

  return {
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
    submittedByName: resolveProfileName(row.submitter ?? null),
    approvedByName: resolveProfileName(row.approver ?? null),
    returnedByName: resolveProfileName(row.returner ?? null),
  };
}

export function mapMdhoCatalogRows(rows: RpcCategoryRow[]): MdhoCatalog {
  const categories = rows
    .filter((row): row is RpcCategoryRow & { code: MdhoCatalogCategory["code"] } =>
      isMdhoCategoryCode(row.code),
    )
    .map((row): MdhoCatalogCategory => {
      const optionsRaw = row.mdho_options;
      const optionsList = Array.isArray(optionsRaw) ? optionsRaw : optionsRaw ? [optionsRaw] : [];

      return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        allowsMultiple: row.allows_multiple,
        requiresSelection: row.requires_selection,
        displayOrder: row.display_order,
        options: optionsList
          .slice()
          .sort((a, b) => a.display_order - b.display_order)
          .map((option) => ({
            id: option.id,
            categoryId: option.category_id,
            code: option.code,
            label: option.label,
            allowsDetail: option.allows_detail,
            displayOrder: option.display_order,
          })),
      };
    })
    .sort((a, b) => a.displayOrder - b.displayOrder);

  return { categories };
}

type RpcStartData = {
  assessment: {
    id: string;
    occurrence_id: string;
    status: string;
    created_at: string;
    updated_at?: string;
  };
  occurrence: { id: string; status: string };
};

export function mapStartMdhoResult(data: RpcStartData): StartMdhoAssessmentResult {
  if (
    !isMdhoAssessmentStatus(data.assessment.status) ||
    !isOccurrenceStatus(data.occurrence.status)
  ) {
    throw new Error("Resposta inválida ao iniciar MDHO.");
  }

  return {
    assessment: {
      id: data.assessment.id,
      occurrenceId: data.assessment.occurrence_id,
      status: data.assessment.status,
      createdAt: data.assessment.created_at,
      updatedAt: data.assessment.updated_at ?? data.assessment.created_at,
    },
    occurrence: {
      id: data.occurrence.id,
      status: data.occurrence.status,
    },
  };
}

type RpcSaveDraftData = {
  assessment_id: string;
  status: string;
  updated_at: string;
};

export function mapSaveMdhoDraftResult(data: RpcSaveDraftData): SaveMdhoDraftResult {
  if (!isMdhoAssessmentStatus(data.status)) {
    throw new Error("Resposta inválida ao salvar rascunho MDHO.");
  }

  return {
    assessmentId: data.assessment_id,
    status: data.status,
    updatedAt: data.updated_at,
  };
}

type RpcSubmitData = {
  assessment: {
    id: string;
    status: string;
    submitted_at: string;
    submitted_by: string;
  };
  occurrence: { id: string; status: string };
};

export function mapSubmitMdhoResult(data: RpcSubmitData): SubmitMdhoAssessmentResult {
  if (data.assessment.status !== "SUBMITTED" || !isOccurrenceStatus(data.occurrence.status)) {
    throw new Error("Resposta inválida ao enviar MDHO.");
  }

  return {
    assessment: {
      id: data.assessment.id,
      status: "SUBMITTED",
      submittedAt: data.assessment.submitted_at,
      submittedBy: data.assessment.submitted_by,
    },
    occurrence: {
      id: data.occurrence.id,
      status: data.occurrence.status,
    },
  };
}

type RpcApproveData = {
  assessment: {
    id: string;
    status: string;
    approved_at: string;
    approved_by: string;
  };
  occurrence: { id: string; status: string };
};

export function mapApproveMdhoResult(data: RpcApproveData): ApproveMdhoAssessmentResult {
  if (data.assessment.status !== "APPROVED" || !isOccurrenceStatus(data.occurrence.status)) {
    throw new Error("Resposta inválida ao aprovar MDHO.");
  }

  return {
    assessment: {
      id: data.assessment.id,
      status: "APPROVED",
      approvedAt: data.assessment.approved_at,
      approvedBy: data.assessment.approved_by,
    },
    occurrence: {
      id: data.occurrence.id,
      status: data.occurrence.status,
    },
  };
}

type RpcReturnData = {
  assessment: {
    id: string;
    status: string;
    returned_at: string;
    returned_by: string;
    return_reason: string;
  };
  occurrence: { id: string; status: string };
};

export function mapReturnMdhoResult(data: RpcReturnData): ReturnMdhoAssessmentResult {
  if (data.assessment.status !== "RETURNED" || !isOccurrenceStatus(data.occurrence.status)) {
    throw new Error("Resposta inválida ao devolver MDHO.");
  }

  return {
    assessment: {
      id: data.assessment.id,
      status: "RETURNED",
      returnedAt: data.assessment.returned_at,
      returnedBy: data.assessment.returned_by,
      returnReason: data.assessment.return_reason,
    },
    occurrence: {
      id: data.occurrence.id,
      status: data.occurrence.status,
    },
  };
}

export type { RpcAssessmentRow, RpcCategoryRow };

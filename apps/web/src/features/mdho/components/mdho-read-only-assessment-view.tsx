import type { MdhoCatalogCategory } from "@safestop/types";

import type { MdhoAssessmentEnriched } from "../types";
import { formatMdhoDateTime, resolveMdhoSelectionLabels } from "../utils/mdho-read-only-view";

type MdhoReadOnlyAssessmentViewProps = {
  assessment: MdhoAssessmentEnriched;
  categories: MdhoCatalogCategory[];
  showSubmittedMetadata?: boolean;
};

export function MdhoReadOnlyAssessmentView({
  assessment,
  categories,
  showSubmittedMetadata = false,
}: MdhoReadOnlyAssessmentViewProps) {
  const summaryItems = resolveMdhoSelectionLabels(assessment, categories);

  return (
    <>
      {summaryItems.map((item) => (
        <div key={item.categoryName} className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {item.categoryName}
          </span>
          <p className="text-sm text-gray-100">
            {item.labels.length > 0 ? item.labels.join("; ") : "—"}
          </p>
        </div>
      ))}

      {assessment.complement?.trim() ? (
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Complemento da avaliação
          </span>
          <p className="whitespace-pre-wrap text-sm text-gray-100">{assessment.complement}</p>
        </div>
      ) : null}

      {showSubmittedMetadata ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Enviado por
            </span>
            <span className="text-sm text-gray-100">{assessment.submittedByName ?? "—"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Em</span>
            <span className="text-sm text-gray-100">
              {formatMdhoDateTime(assessment.submittedAt)}
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}

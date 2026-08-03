import type { MdhoCatalogCategory } from "@safestop/types";

import { MdhoReadOnlyAssessmentView } from "./mdho-read-only-assessment-view";
import type { MdhoAssessmentEnriched } from "../types";
import { formatMdhoDateTime } from "../utils/mdho-read-only-view";

type MdhoSummaryProps = {
  assessment: MdhoAssessmentEnriched;
  categories: MdhoCatalogCategory[];
};

export function MdhoSummary({ assessment, categories }: MdhoSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <span className="inline-flex w-fit rounded-full border border-green-600/50 bg-green-950/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-300">
        Aprovado
      </span>

      <MdhoReadOnlyAssessmentView assessment={assessment} categories={categories} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Aprovado por
          </span>
          <span className="text-sm text-gray-100">{assessment.approvedByName ?? "—"}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Em</span>
          <span className="text-sm text-gray-100">{formatMdhoDateTime(assessment.approvedAt)}</span>
        </div>
      </div>

      <p className="text-sm text-gray-400">Aguardando registro da referência IMS</p>
    </div>
  );
}

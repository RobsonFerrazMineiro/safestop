"use client";

import type { MdhoCatalogCategory } from "@safestop/types";

import { MdhoReadOnlyAssessmentView } from "@/features/mdho/components/mdho-read-only-assessment-view";
import type { MdhoAssessmentEnriched } from "@/features/mdho/types";

import { useHseApprovalContext } from "../hooks/use-hse-approval-context";
import { HseApprovalActions } from "./hse-approval-actions";

type HseApprovalReviewPanelProps = {
  assessment: MdhoAssessmentEnriched;
  categories: MdhoCatalogCategory[];
  occurrenceId: string;
  organizationId: string;
  onConflict: () => void;
  onRefresh?: () => void;
};

export function HseApprovalReviewPanel({
  assessment,
  categories,
  occurrenceId,
  organizationId,
  onConflict,
  onRefresh,
}: HseApprovalReviewPanelProps) {
  const { canApprove, canReturn, isSelfSubmitted, isOffline } = useHseApprovalContext();

  const showApprove = canApprove(assessment);
  const showReturn = canReturn(assessment);
  const showSelfApprovalNotice =
    isSelfSubmitted(assessment) && assessment.status === "SUBMITTED" && showReturn && !showApprove;

  return (
    <div
      className="flex flex-col gap-4 rounded-lg border border-amber-700/40 bg-amber-950/20 p-4"
      id="mdho-review"
    >
      <p className="text-sm font-medium text-amber-200">Aguardando aprovação HSE</p>

      <MdhoReadOnlyAssessmentView
        assessment={assessment}
        categories={categories}
        showSubmittedMetadata
      />

      <HseApprovalActions
        assessmentId={assessment.id}
        canApprove={showApprove}
        canReturn={showReturn}
        isOffline={isOffline}
        occurrenceId={occurrenceId}
        organizationId={organizationId}
        showSelfApprovalNotice={showSelfApprovalNotice}
        onConflict={onConflict}
        onSelfApprovalBlocked={() => {
          onRefresh?.();
        }}
      />
    </div>
  );
}

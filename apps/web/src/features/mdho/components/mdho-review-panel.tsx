"use client";

import type { MdhoCatalogCategory } from "@safestop/types";

import { HseApprovalReviewPanel } from "@/features/hse-approval/components/hse-approval-review-panel";

import type { MdhoAssessmentEnriched } from "../types";

type MdhoReviewPanelProps = {
  assessment: MdhoAssessmentEnriched;
  categories: MdhoCatalogCategory[];
  occurrenceId: string;
  organizationId: string;
  onConflict: () => void;
  onRefresh?: () => void;
};

export function MdhoReviewPanel({
  assessment,
  categories,
  occurrenceId,
  organizationId,
  onConflict,
  onRefresh,
}: MdhoReviewPanelProps) {
  return (
    <HseApprovalReviewPanel
      assessment={assessment}
      categories={categories}
      occurrenceId={occurrenceId}
      organizationId={organizationId}
      onConflict={onConflict}
      onRefresh={onRefresh}
    />
  );
}

"use client";

import { useState } from "react";

import type { OccurrenceDetailsEnriched } from "@/features/occurrences/types";
import { useInvalidateMdhoCaches } from "../hooks/use-invalidate-mdho-caches";
import { useMdhoAssessment } from "../hooks/use-mdho-assessment";
import { useMdhoCatalog } from "../hooks/use-mdho-catalog";
import { useMdhoContext } from "../hooks/use-mdho-context";
import { shouldShowMdhoSection } from "../types";
import { MdhoForm } from "./mdho-form";
import { MdhoReviewPanel } from "./mdho-review-panel";
import { MdhoStartCard } from "./mdho-start-card";
import { MdhoConflictCard, MdhoLoadingSkeleton, MdhoReturnedBanner } from "./mdho-states";
import { MdhoSummary } from "./mdho-summary";

type MdhoSectionProps = {
  occurrence: OccurrenceDetailsEnriched;
  organizationId: string;
  onRefresh: () => Promise<unknown>;
  isRefreshing: boolean;
};

export function MdhoSection({
  occurrence,
  organizationId,
  onRefresh,
  isRefreshing,
}: MdhoSectionProps) {
  const sectionVisible = shouldShowMdhoSection(occurrence);
  const { assessment, isLoading, isFetching, refetch } = useMdhoAssessment(
    occurrence.id,
    sectionVisible,
  );
  const { categories, isLoading: isCatalogLoading } = useMdhoCatalog(sectionVisible);
  const context = useMdhoContext(occurrence, assessment);
  const invalidateCaches = useInvalidateMdhoCaches();
  const [showConflict, setShowConflict] = useState(false);

  if (!sectionVisible || !context.shouldRenderSection) {
    return null;
  }

  async function handleRefresh() {
    await invalidateCaches(organizationId, occurrence.id);
    await refetch();
    await onRefresh();
    setShowConflict(false);
  }

  const isBusy = isRefreshing || isFetching;

  return (
    <section
      aria-label="Avaliação Técnica MDHO"
      className="flex flex-col gap-4 rounded-lg border border-blue-800/40 bg-gray-900/40 p-4"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-300">
        Avaliação Técnica (MDHO)
      </h2>

      {showConflict ? (
        <MdhoConflictCard
          isRefreshing={isBusy}
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      ) : null}

      {!showConflict && (isLoading || isCatalogLoading) ? <MdhoLoadingSkeleton /> : null}

      {!showConflict && !isLoading && !isCatalogLoading ? (
        <>
          {!assessment && context.canStartMdho ? (
            <MdhoStartCard
              isOffline={context.isOffline}
              occurrenceId={occurrence.id}
              organizationId={organizationId}
              onConflict={() => {
                setShowConflict(true);
              }}
            />
          ) : null}

          {assessment?.status === "RETURNED" && assessment.returnReason ? (
            <MdhoReturnedBanner returnReason={assessment.returnReason} />
          ) : null}

          {assessment && (assessment.status === "DRAFT" || assessment.status === "RETURNED") ? (
            <MdhoForm
              key={assessment.updatedAt}
              assessment={assessment}
              canEdit={context.canEditMdho}
              canSubmit={context.canSubmitMdho}
              categories={categories}
              isOffline={context.isOffline}
              occurrenceId={occurrence.id}
              organizationId={organizationId}
              onConflict={() => {
                setShowConflict(true);
              }}
            />
          ) : null}

          {assessment?.status === "SUBMITTED" ? (
            <MdhoReviewPanel
              assessment={assessment}
              categories={categories}
              occurrenceId={occurrence.id}
              organizationId={organizationId}
              onConflict={() => {
                setShowConflict(true);
              }}
              onRefresh={() => {
                void handleRefresh();
              }}
            />
          ) : null}

          {assessment?.status === "APPROVED" ? (
            <MdhoSummary assessment={assessment} categories={categories} />
          ) : null}
        </>
      ) : null}

      {!context.canEditMdho && !context.canStartMdho ? (
        <span className="sr-only">Você não tem permissão para esta ação no MDHO.</span>
      ) : null}
    </section>
  );
}

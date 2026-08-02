"use client";

import { useState } from "react";
import {
  hasOccurrenceDecision,
  isInterdicaoDecisionBranch,
  isVerEAgirDecisionBranch,
} from "@safestop/types";

import type { OccurrenceDetailsEnriched } from "@/features/occurrences/types";
import { useInvalidateOccurrenceDecisionCaches } from "@/features/occurrences/hooks/use-invalidate-occurrence-decision-caches";
import {
  InterdicaoDecisionCard,
  InterdicaoSummary,
  useInterdicaoContext,
} from "@/features/interdicao-oficial";
import { shouldShowMdhoSection } from "@/features/mdho";
import {
  AlreadyDecidedCard,
  EvaluationConflictCard,
  EvaluationContextCard,
  OfflineNotice,
  StartEvaluationButton,
  useVerEAgirContext,
  VerEAgirPanel,
  VerEAgirSummary,
} from "@/features/ver-e-agir";

type LeadershipDecisionSectionProps = {
  occurrence: OccurrenceDetailsEnriched;
  organizationId: string;
  onRefresh: () => Promise<unknown>;
  isRefreshing: boolean;
};

export function LeadershipDecisionSection({
  occurrence,
  organizationId,
  onRefresh,
  isRefreshing,
}: LeadershipDecisionSectionProps) {
  const vaContext = useVerEAgirContext(occurrence);
  const ioContext = useInterdicaoContext(occurrence);
  const invalidateCaches = useInvalidateOccurrenceDecisionCaches();
  const [showConflict, setShowConflict] = useState(false);
  const [showAlreadyDecided, setShowAlreadyDecided] = useState(false);

  const hasDecision = hasOccurrenceDecision(occurrence);
  const showVaSummary = isVerEAgirDecisionBranch(occurrence);
  const showIoSummary = isInterdicaoDecisionBranch(occurrence);
  const showDecisionForms =
    occurrence.status === "EM_AVALIACAO" && !hasDecision && !showConflict && !showAlreadyDecided;
  const visibleDecisionCards =
    (vaContext.canRecordVerEAgir ? 1 : 0) + (ioContext.canConfirmInterdiction ? 1 : 0);

  const shouldRenderSection =
    vaContext.showPendingEvaluation ||
    showDecisionForms ||
    showVaSummary ||
    showIoSummary ||
    (occurrence.status === "EM_AVALIACAO" &&
      vaContext.canViewEvaluationContext &&
      !hasDecision &&
      visibleDecisionCards === 0);

  if (!shouldRenderSection) {
    return null;
  }

  async function handleRefresh() {
    await invalidateCaches(organizationId, occurrence.id);
    await onRefresh();
    setShowConflict(false);
    setShowAlreadyDecided(false);
  }

  const sectionTitle = hasDecision
    ? "Decisão"
    : occurrence.status === "EM_AVALIACAO"
      ? "Decisão da liderança"
      : "Avaliação";

  const sectionClassName =
    occurrence.status === "EM_AVALIACAO" && !hasDecision
      ? "flex flex-col gap-4 rounded-lg border border-amber-700/40 bg-gray-900/40 p-4"
      : "flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-900/40 p-4";

  return (
    <section aria-label={sectionTitle} className={sectionClassName}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
        {sectionTitle}
      </h2>

      {showConflict ? (
        <EvaluationConflictCard
          isRefreshing={isRefreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      ) : null}

      {showAlreadyDecided ? (
        <AlreadyDecidedCard
          isRefreshing={isRefreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      ) : null}

      {!showConflict && !showAlreadyDecided && showIoSummary ? (
        occurrence.decision ? (
          <InterdicaoSummary
            decision={occurrence.decision}
            hideMdhoHint={shouldShowMdhoSection(occurrence)}
          />
        ) : (
          <AlreadyDecidedCard
            isRefreshing={isRefreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
          />
        )
      ) : null}

      {!showConflict && !showAlreadyDecided && showVaSummary && !showIoSummary ? (
        occurrence.decision ? (
          <VerEAgirSummary decision={occurrence.decision} />
        ) : (
          <AlreadyDecidedCard
            isRefreshing={isRefreshing}
            onRefresh={() => {
              void handleRefresh();
            }}
          />
        )
      ) : null}

      {!showConflict && !showAlreadyDecided && vaContext.showPendingEvaluation ? (
        <div className="flex flex-col gap-4">
          <div
            className="flex items-start gap-3 rounded-lg border border-blue-700/40 bg-blue-950/20 p-4"
            role="status"
          >
            <span aria-hidden="true" className="text-blue-400">
              ℹ
            </span>
            <p className="text-sm text-blue-100">Aguardando avaliação da liderança</p>
          </div>

          {vaContext.isOffline ? (
            <OfflineNotice message="Você está offline. Conecte-se para continuar." />
          ) : null}

          <StartEvaluationButton
            isOffline={vaContext.isOffline}
            occurrenceId={occurrence.id}
            organizationId={organizationId}
            onConflict={() => {
              setShowConflict(true);
            }}
          />
        </div>
      ) : null}

      {!showConflict && !showAlreadyDecided && showDecisionForms ? (
        <div className="flex flex-col gap-4">
          <EvaluationContextCard occurrence={occurrence} />

          {visibleDecisionCards > 0 ? (
            <p className="text-sm text-gray-400">
              Avalie a ocorrência e selecione uma das decisões abaixo:
            </p>
          ) : null}

          <div
            className={
              visibleDecisionCards > 1
                ? "grid grid-cols-1 gap-3 md:grid-cols-2"
                : "grid grid-cols-1 gap-3"
            }
          >
            {vaContext.canRecordVerEAgir ? (
              <VerEAgirPanel
                isOffline={vaContext.isOffline}
                occurrence={occurrence}
                organizationId={organizationId}
                onAlreadyDecided={() => {
                  setShowAlreadyDecided(true);
                }}
                onConflict={() => {
                  setShowConflict(true);
                }}
              />
            ) : null}

            {ioContext.canConfirmInterdiction ? (
              <InterdicaoDecisionCard
                isOffline={ioContext.isOffline}
                occurrenceId={occurrence.id}
                organizationId={organizationId}
                onAlreadyDecided={() => {
                  setShowAlreadyDecided(true);
                }}
                onConflict={() => {
                  setShowConflict(true);
                }}
              />
            ) : null}
          </div>

          {!vaContext.canRecordVerEAgir && !ioContext.canConfirmInterdiction ? (
            <span className="sr-only">
              Você não tem permissão para avaliar ou confirmar interdição nesta ocorrência.
            </span>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useState } from "react";

import type { OccurrenceDetailsEnriched } from "@/features/occurrences/types";
import {
  AlreadyDecidedCard,
  EvaluationConflictCard,
  EvaluationContextCard,
  OfflineNotice,
  StartEvaluationButton,
  useInvalidateVerEAgirCaches,
  useVerEAgirContext,
  VerEAgirPanel,
  VerEAgirSummary,
} from "@/features/ver-e-agir";

type VerEAgirDetailSectionProps = {
  occurrence: OccurrenceDetailsEnriched;
  organizationId: string;
  onRefresh: () => Promise<unknown>;
  isRefreshing: boolean;
};

export function VerEAgirDetailSection({
  occurrence,
  organizationId,
  onRefresh,
  isRefreshing,
}: VerEAgirDetailSectionProps) {
  const context = useVerEAgirContext(occurrence);
  const invalidateCaches = useInvalidateVerEAgirCaches();
  const [showConflict, setShowConflict] = useState(false);
  const [showAlreadyDecided, setShowAlreadyDecided] = useState(false);

  if (!context.shouldRenderSection) {
    return null;
  }

  async function handleRefresh() {
    await invalidateCaches(organizationId, occurrence.id);
    await onRefresh();
    setShowConflict(false);
    setShowAlreadyDecided(false);
  }

  const sectionTitle = context.showSummary
    ? "Decisão"
    : context.showEvaluationForm || occurrence.status === "EM_AVALIACAO"
      ? "Decisão da liderança"
      : "Avaliação";

  return (
    <section
      aria-label={sectionTitle}
      className="flex flex-col gap-4 rounded-lg border border-gray-800 bg-gray-900/40 p-4"
    >
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

      {!showConflict && !showAlreadyDecided && context.showSummary ? (
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

      {!showConflict && !showAlreadyDecided && context.showPendingEvaluation ? (
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

          {context.isOffline ? (
            <OfflineNotice message="Você está offline. Conecte-se para continuar." />
          ) : null}

          <StartEvaluationButton
            isOffline={context.isOffline}
            occurrenceId={occurrence.id}
            organizationId={organizationId}
            onConflict={() => {
              setShowConflict(true);
            }}
          />
        </div>
      ) : null}

      {!showConflict &&
      !showAlreadyDecided &&
      !context.showSummary &&
      occurrence.status === "EM_AVALIACAO" ? (
        context.showEvaluationForm ? (
          <VerEAgirPanel
            isOffline={context.isOffline}
            occurrence={occurrence}
            organizationId={organizationId}
            onAlreadyDecided={() => {
              setShowAlreadyDecided(true);
            }}
            onConflict={() => {
              setShowConflict(true);
            }}
          />
        ) : context.canViewEvaluationContext ? (
          <EvaluationContextCard occurrence={occurrence} />
        ) : null
      ) : null}

      {!context.canStartEvaluation && !context.canRecordVerEAgir ? (
        <span className="sr-only">Você não tem permissão para avaliar esta ocorrência.</span>
      ) : null}
    </section>
  );
}

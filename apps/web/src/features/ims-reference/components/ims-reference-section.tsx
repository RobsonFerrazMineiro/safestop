"use client";

import { useState } from "react";

import type { OccurrenceDetailsEnriched } from "@/features/occurrences/types";
import { useMdhoAssessment } from "@/features/mdho/hooks/use-mdho-assessment";
import { shouldShowMdhoSection } from "@/features/mdho/types";

import { useImsReferenceContext } from "../hooks/use-ims-reference-context";
import { useInvalidateImsReferenceCaches } from "../hooks/use-invalidate-ims-reference-caches";
import { ImsReferenceCard } from "./ims-reference-card";
import { ImsReferenceForm } from "./ims-reference-form";
import { ImsConflictCard } from "./ims-reference-states";

type ImsReferenceSectionProps = {
  occurrence: OccurrenceDetailsEnriched;
  organizationId: string;
  onRefresh: () => Promise<unknown>;
  isRefreshing: boolean;
};

export function ImsReferenceSection({
  occurrence,
  organizationId,
  onRefresh,
  isRefreshing,
}: ImsReferenceSectionProps) {
  const mdhoVisible = shouldShowMdhoSection(occurrence);
  const { assessment } = useMdhoAssessment(occurrence.id, mdhoVisible);
  const hasMdhoApproved = assessment
    ? assessment.status === "APPROVED"
    : occurrence.status !== "AGUARDANDO_REGISTRO_IMS";

  const context = useImsReferenceContext(occurrence, {
    hasMdhoApproved,
  });
  const invalidateCaches = useInvalidateImsReferenceCaches();
  const [showConflict, setShowConflict] = useState(false);

  if (!context.shouldRenderSection || !context.canView) {
    return null;
  }

  async function handleRefresh() {
    await invalidateCaches(organizationId, occurrence.id);
    await onRefresh();
    setShowConflict(false);
  }

  const hasRegisteredCode =
    occurrence.imsReferenceCode !== null && occurrence.imsReferenceCode.trim() !== "";
  const showForm =
    !showConflict &&
    !hasRegisteredCode &&
    context.canRegister &&
    occurrence.status === "AGUARDANDO_REGISTRO_IMS";

  return (
    <section
      aria-label="Referência IMS"
      className="flex flex-col gap-4 rounded-lg border border-gray-700/60 bg-gray-900/40 p-4"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-300">
        Referência IMS
      </h2>

      {showConflict ? (
        <ImsConflictCard
          isRefreshing={isRefreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      ) : null}

      {!showConflict && showForm ? (
        <ImsReferenceForm
          isOffline={context.isOffline}
          occurrenceId={occurrence.id}
          organizationId={organizationId}
          onAlreadyRegistered={() => {
            void handleRefresh();
          }}
          onConflict={() => {
            setShowConflict(true);
          }}
        />
      ) : null}

      {!showConflict && hasRegisteredCode ? (
        <ImsReferenceCard
          canUpdate={context.canUpdate}
          isOffline={context.isOffline}
          occurrence={occurrence}
          organizationId={organizationId}
          onConflict={() => {
            setShowConflict(true);
          }}
        />
      ) : null}

      {!context.canRegister && !context.canUpdate && !hasRegisteredCode ? (
        <span className="sr-only">Você não tem permissão para registrar a referência IMS.</span>
      ) : null}
    </section>
  );
}

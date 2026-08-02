import { useState } from "react";
import { Alert, ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { OccurrenceDetails } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { EvaluationConflictCard } from "@/features/ver-e-agir/components/evaluation-conflict-card";

import { MdhoReturnedBanner } from "./mdho-returned-banner";
import { MdhoReviewPanel } from "./mdho-review-panel";
import { MdhoStartCard } from "./mdho-start-card";
import { MdhoStepperForm } from "./mdho-stepper-form";
import { MdhoSummary } from "./mdho-summary";
import {
  useApproveMdho,
  useMdhoAssessment,
  useMdhoCatalog,
  useReturnMdho,
  useSaveMdhoDraft,
  useStartMdho,
  useSubmitMdho,
} from "../hooks";
import { MdhoMutationError } from "../utils/mdho-errors";
import type { MdhoFormState } from "../utils/mdho-form-state";
import {
  canApproveMdho,
  canEditMdho,
  canReturnMdho,
  canStartMdho,
  canSubmitMdho,
  shouldShowMdhoForm,
  shouldShowMdhoReview,
  shouldShowMdhoSection,
  shouldShowMdhoSummary,
} from "../utils/mdho-permissions";

type MdhoSectionProps = {
  occurrence: OccurrenceDetails;
  isOnline: boolean;
  isRefreshing?: boolean;
  onRefresh: () => Promise<unknown>;
};

export function MdhoSection({
  occurrence,
  isOnline,
  isRefreshing = false,
  onRefresh,
}: MdhoSectionProps) {
  const { can, isPlatformAdmin } = useAuthorization();
  const canFill = can("mdho.fill");
  const canSubmitPermission = can("mdho.submit");
  const canApprovePermission = can("mdho.approve");
  const canReturnPermission = can("mdho.return");
  const canRead = can("occurrence.read");

  const {
    assessment,
    isLoading: isAssessmentLoading,
    refetch: refetchAssessment,
  } = useMdhoAssessment(occurrence.id);
  const { catalog, isLoading: isCatalogLoading } = useMdhoCatalog();

  const { startMdho, isStarting } = useStartMdho(occurrence.id);
  const { saveDraft, isSaving } = useSaveMdhoDraft(occurrence.id);
  const { submitMdho, isSubmitting } = useSubmitMdho(occurrence.id);
  const { approveMdho, isApproving } = useApproveMdho(occurrence.id);
  const { returnMdho, isReturning } = useReturnMdho(occurrence.id);

  const [showConflict, setShowConflict] = useState(false);

  if (!canRead || !shouldShowMdhoSection(occurrence)) {
    return null;
  }

  const hasAssessment = assessment !== null;
  const assessmentStatus = assessment?.status ?? null;

  const showStart = canStartMdho({
    canFill,
    isPlatformAdmin,
    occurrence,
    hasAssessment,
  });
  const showForm =
    catalog &&
    assessment &&
    shouldShowMdhoForm(assessmentStatus) &&
    canEditMdho({ canFill, isPlatformAdmin, status: assessmentStatus });
  const showReview = catalog && assessment && shouldShowMdhoReview(assessmentStatus);
  const showSummary = catalog && assessment && shouldShowMdhoSummary(assessmentStatus);

  async function handleRefresh() {
    setShowConflict(false);
    await Promise.all([onRefresh(), refetchAssessment()]);
  }

  async function handleMutationConflict(error: unknown, fallbackMessage: string) {
    if (error instanceof MdhoMutationError && error.code === "ALREADY_EXISTS") {
      await handleRefresh();
      return;
    }

    if (error instanceof MdhoMutationError && error.isConflict()) {
      setShowConflict(true);
      Alert.alert("Esta avaliação foi atualizada", "Atualize para continuar.");
      return;
    }

    Alert.alert("Erro", error instanceof Error ? error.message : fallbackMessage);
  }

  async function handleStart() {
    try {
      await startMdho();
      setShowConflict(false);
    } catch (error) {
      await handleMutationConflict(error, "Não foi possível iniciar o MDHO.");
    }
  }

  async function handleSaveDraft(form: MdhoFormState) {
    if (!assessment) {
      return;
    }

    try {
      await saveDraft({
        assessmentId: assessment.id,
        selections: form.selections,
        complement: form.complement.trim() ? form.complement : undefined,
        expectedUpdatedAt: assessment.updatedAt,
      });
    } catch (error) {
      await handleMutationConflict(error, "Não foi possível salvar o rascunho.");
      throw error;
    }
  }

  async function handleSubmit(form: MdhoFormState) {
    if (!assessment) {
      return;
    }

    try {
      await saveDraft({
        assessmentId: assessment.id,
        selections: form.selections,
        complement: form.complement.trim() ? form.complement : undefined,
        expectedUpdatedAt: assessment.updatedAt,
      });
      await submitMdho(assessment.id);
      setShowConflict(false);
    } catch (error) {
      await handleMutationConflict(error, "Não foi possível enviar o MDHO.");
    }
  }

  async function handleApprove() {
    if (!assessment) {
      return;
    }

    try {
      await approveMdho(assessment.id);
      setShowConflict(false);
    } catch (error) {
      await handleMutationConflict(error, "Não foi possível aprovar o MDHO.");
    }
  }

  async function handleReturn(returnReason: string) {
    if (!assessment) {
      return;
    }

    try {
      await returnMdho({ assessmentId: assessment.id, returnReason });
      setShowConflict(false);
    } catch (error) {
      await handleMutationConflict(error, "Não foi possível devolver o MDHO.");
    }
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        Avaliação Técnica (MDHO)
      </Text>

      {isAssessmentLoading || isCatalogLoading ? (
        <ActivityIndicator color="#2563EB" size="small" />
      ) : null}

      {showConflict ? (
        <EvaluationConflictCard
          isRefreshing={isRefreshing}
          message="Atualize para ver o estado atual antes de continuar."
          title="Esta avaliação foi atualizada"
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      ) : null}

      {!showConflict && showStart ? (
        <MdhoStartCard isOnline={isOnline} isStarting={isStarting} onStart={handleStart} />
      ) : null}

      {!showConflict && assessment?.status === "RETURNED" && assessment.returnReason ? (
        <MdhoReturnedBanner returnReason={assessment.returnReason} />
      ) : null}

      {!showConflict && showForm && assessment && catalog ? (
        <MdhoStepperForm
          assessment={assessment}
          canSubmit={canSubmitMdho({
            canSubmit: canSubmitPermission,
            isPlatformAdmin,
            status: assessmentStatus,
          })}
          catalog={catalog.categories}
          isOnline={isOnline}
          isSaving={isSaving}
          isSubmitting={isSubmitting}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
        />
      ) : null}

      {!showConflict && showReview && assessment && catalog ? (
        <MdhoReviewPanel
          assessment={assessment}
          canApprove={canApproveMdho({
            canApprove: canApprovePermission,
            isPlatformAdmin,
            status: assessmentStatus,
          })}
          canReturn={canReturnMdho({
            canReturn: canReturnPermission,
            isPlatformAdmin,
            status: assessmentStatus,
          })}
          catalog={catalog.categories}
          isApproving={isApproving}
          isOnline={isOnline}
          isReturning={isReturning}
          onApprove={handleApprove}
          onReturn={handleReturn}
        />
      ) : null}

      {!showConflict && showSummary && assessment && catalog ? (
        <MdhoSummary assessment={assessment} catalog={catalog.categories} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginTop: 8,
  },
  sectionTitle: {
    borderTopColor: "#1F2937",
    borderTopWidth: 1,
    color: "#93C5FD",
    fontSize: 13,
    fontWeight: "700",
    paddingTop: 12,
    textTransform: "uppercase",
  },
});

import { useCallback, useEffect, useState, type RefObject } from "react";
import { Alert, ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { OccurrenceDetails } from "@safestop/types";
import { colors, spacing, statusChip, typography } from "@safestop/ui";

import { CollapsibleSection } from "@/components/collapsible-section";
import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import {
  HSE_APPROVAL_COPY,
  HseReviewContent,
  canApproveHse,
  canReturnHse,
  type HseActionsFooterState,
} from "@/features/hse-approval";
import { EvaluationConflictCard } from "@/features/ver-e-agir/components/evaluation-conflict-card";
import { useAuth } from "@/hooks/use-auth";

import { MdhoReturnedBanner } from "./mdho-returned-banner";
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
  canEditMdho,
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
  onHseFooterChange?: (state: HseActionsFooterState | null) => void;
  reviewSectionRef?: RefObject<View | null>;
  hideImsHint?: boolean;
};

export function MdhoSection({
  occurrence,
  isOnline,
  isRefreshing = false,
  onRefresh,
  onHseFooterChange,
  reviewSectionRef,
  hideImsHint = false,
}: MdhoSectionProps) {
  const { user } = useAuth();
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

  const shouldRender = canRead && shouldShowMdhoSection(occurrence);

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

  const canApproveHseAction =
    assessment &&
    canApproveHse({
      canApprove: canApprovePermission,
      isPlatformAdmin,
      status: assessmentStatus,
      submittedBy: assessment.submittedBy,
      currentUserId: user?.id,
    });

  const canReturnHseAction = canReturnHse({
    canReturn: canReturnPermission,
    isPlatformAdmin,
    status: assessmentStatus,
  });

  const showSelfApprovalInfo =
    assessment?.status === "SUBMITTED" &&
    assessment.submittedBy !== null &&
    assessment.submittedBy === user?.id &&
    canApprovePermission &&
    !isPlatformAdmin;

  const handleRefresh = useCallback(async () => {
    setShowConflict(false);
    await Promise.all([onRefresh(), refetchAssessment()]);
  }, [onRefresh, refetchAssessment]);

  const handleMutationConflict = useCallback(
    async (error: unknown, fallbackMessage: string) => {
      if (error instanceof MdhoMutationError && error.code === "ALREADY_EXISTS") {
        await handleRefresh();
        return;
      }

      if (error instanceof MdhoMutationError && error.code === "SELF_APPROVAL_FORBIDDEN") {
        Alert.alert(HSE_APPROVAL_COPY.selfApprovalInfo);
        await handleRefresh();
        return;
      }

      if (error instanceof MdhoMutationError && error.isConflict()) {
        setShowConflict(true);
        Alert.alert(HSE_APPROVAL_COPY.conflictMessage);
        return;
      }

      Alert.alert("Erro", error instanceof Error ? error.message : fallbackMessage);
    },
    [handleRefresh],
  );

  const handleApprove = useCallback(async () => {
    if (!assessment) {
      return;
    }

    try {
      await approveMdho(assessment.id);
      setShowConflict(false);
    } catch (error) {
      await handleMutationConflict(error, "Não foi possível aprovar o MDHO.");
    }
  }, [approveMdho, assessment, handleMutationConflict]);

  const handleReturn = useCallback(
    async (returnReason: string) => {
      if (!assessment) {
        return;
      }

      try {
        await returnMdho({ assessmentId: assessment.id, returnReason });
        setShowConflict(false);
      } catch (error) {
        await handleMutationConflict(error, "Não foi possível devolver o MDHO.");
      }
    },
    [assessment, handleMutationConflict, returnMdho],
  );

  useEffect(() => {
    if (!onHseFooterChange || !shouldRender) {
      onHseFooterChange?.(null);
      return;
    }

    if (!showConflict && showReview && assessment && (canApproveHseAction || canReturnHseAction)) {
      onHseFooterChange({
        visible: true,
        canApprove: canApproveHseAction ?? false,
        canReturn: canReturnHseAction,
        isOnline,
        isApproving,
        isReturning,
        onApprove: () => {
          void handleApprove();
        },
        onReturn: handleReturn,
      });
      return;
    }

    onHseFooterChange(null);
  }, [
    assessment,
    canApproveHseAction,
    canReturnHseAction,
    handleApprove,
    handleReturn,
    isApproving,
    isOnline,
    isReturning,
    onHseFooterChange,
    shouldRender,
    showConflict,
    showReview,
  ]);

  if (!shouldRender) {
    return null;
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

  return (
    <View style={styles.container}>
      {!showReview ? (
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          Avaliação Técnica (MDHO)
        </Text>
      ) : null}

      {isAssessmentLoading || isCatalogLoading ? (
        <ActivityIndicator color={colors.info} size="small" />
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
        <View ref={reviewSectionRef} collapsable={false}>
          <HseReviewContent
            assessment={assessment}
            catalog={catalog.categories}
            showSelfApprovalInfo={showSelfApprovalInfo}
          />
        </View>
      ) : null}

      {!showConflict && showSummary && assessment && catalog ? (
        <CollapsibleSection
          accessibilityLabel="MDHO aprovado"
          summary={
            <Text style={styles.collapsedSummary}>
              MDHO aprovado — {assessment.approvedByName ?? "—"}
            </Text>
          }
        >
          <MdhoSummary
            assessment={assessment}
            catalog={catalog.categories}
            hideImsHint={hideImsHint}
          />
        </CollapsibleSection>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedSummary: {
    color: statusChip.success.foreground,
    fontSize: typography.label.fontSize,
    fontWeight: "600",
  },
  container: {
    gap: spacing[3],
    marginTop: spacing[2],
  },
  sectionTitle: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    color: statusChip.info.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    paddingTop: spacing[3],
    textTransform: "uppercase",
  },
});

import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { OccurrenceDetails } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { useOccurrenceTimeline } from "@/features/timeline/hooks/use-occurrence-timeline";

import { EvaluationConflictCard } from "./evaluation-conflict-card";
import { EvaluationContextCard } from "./evaluation-context-card";
import { EvaluationWaitingBanner, StartEvaluationButton } from "./start-evaluation-button";
import { VerEAgirPanel } from "./ver-e-agir-panel";
import { VerEAgirSummary } from "./ver-e-agir-summary";
import { useRecordVerEAgirDecision, useStartEvaluation } from "../hooks";
import { EvaluationMutationError } from "../utils/evaluation-errors";
import {
  canRecordVerEAgir,
  canStartEvaluation,
  canViewEvaluationContext,
  shouldShowVerEAgirSummary,
} from "../utils/evaluation-permissions";

type EvaluationSectionProps = {
  occurrence: OccurrenceDetails;
  isOnline: boolean;
  isRefreshing?: boolean;
  onRefresh: () => Promise<unknown>;
};

function getLatestCommentBody(
  items: ReturnType<typeof useOccurrenceTimeline>["items"],
): string | null {
  const comment = items.find(
    (item) => item.kind === "COMMENT_ADDED" && item.body && item.metadata.isRemoved !== true,
  );

  return comment?.body ?? null;
}

export function EvaluationSection({
  occurrence,
  isOnline,
  isRefreshing = false,
  onRefresh,
}: EvaluationSectionProps) {
  const { can, isPlatformAdmin } = useAuthorization();
  const canEvaluate = can("occurrence.evaluate");
  const canRead = can("occurrence.read");

  const { startEvaluation, isStarting } = useStartEvaluation(occurrence.id);
  const { recordDecision, isRecording } = useRecordVerEAgirDecision(occurrence.id);
  const { items: timelineItems } = useOccurrenceTimeline(occurrence.id);

  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [alreadyDecidedMessage, setAlreadyDecidedMessage] = useState<string | null>(null);

  const latestCommentBody = useMemo(() => getLatestCommentBody(timelineItems), [timelineItems]);

  const showSummary = shouldShowVerEAgirSummary(occurrence.status, occurrence.decision);
  const showStart = canStartEvaluation({
    canEvaluate,
    isPlatformAdmin,
    status: occurrence.status,
  });
  const showRecord = canRecordVerEAgir({
    canEvaluate,
    isPlatformAdmin,
    status: occurrence.status,
    occurrence,
  });
  const showContext = canViewEvaluationContext(canRead) && occurrence.status === "EM_AVALIACAO";

  async function handleRefresh() {
    setConflictMessage(null);
    setAlreadyDecidedMessage(null);
    await onRefresh();
  }

  async function handleMutationConflict(error: unknown, fallbackMessage: string) {
    if (!(error instanceof EvaluationMutationError) || !error.isConflict()) {
      Alert.alert("Erro", error instanceof Error ? error.message : fallbackMessage);
      return;
    }

    if (error.code === "ALREADY_DECIDED") {
      setAlreadyDecidedMessage("Esta ocorrência já possui uma decisão registrada.");
      await handleRefresh();
      return;
    }

    setConflictMessage(error.message);
    Alert.alert(
      "Esta ocorrência já foi atualizada",
      "Atualize para ver o estado atual antes de continuar.",
    );
  }

  async function handleStartEvaluation() {
    if (!isOnline) {
      Alert.alert("Sem conexão", "Conecte-se para iniciar a avaliação.");
      return;
    }

    try {
      await startEvaluation();
      setConflictMessage(null);
      setAlreadyDecidedMessage(null);
      await onRefresh();
    } catch (error) {
      await handleMutationConflict(error, "Não foi possível iniciar a avaliação.");
    }
  }

  async function handleRecordDecision(decisionReason: string) {
    try {
      await recordDecision(decisionReason);
      setConflictMessage(null);
      setAlreadyDecidedMessage(null);
    } catch (error) {
      await handleMutationConflict(error, "Não foi possível registrar a decisão.");
      throw error;
    }
  }

  if (!canRead) {
    return null;
  }

  if (occurrence.status === "INTERDICAO_CONFIRMADA") {
    return null;
  }

  const sectionTitle = showSummary
    ? "Decisão"
    : occurrence.status === "EM_AVALIACAO"
      ? "Decisão da liderança"
      : "Avaliação";

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {sectionTitle}
      </Text>

      {alreadyDecidedMessage ? (
        <EvaluationConflictCard
          isRefreshing={isRefreshing}
          message={alreadyDecidedMessage}
          title="Decisão já registrada"
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      ) : null}

      {conflictMessage ? (
        <EvaluationConflictCard
          isRefreshing={isRefreshing}
          message="Atualize para ver o estado atual antes de continuar."
          title="Esta ocorrência já foi atualizada"
          onRefresh={() => {
            void handleRefresh();
          }}
        />
      ) : null}

      {showSummary && occurrence.decision ? (
        <VerEAgirSummary decision={occurrence.decision} />
      ) : null}

      {showStart && !conflictMessage ? (
        <View style={styles.stack}>
          <EvaluationWaitingBanner />
          <StartEvaluationButton isStarting={isStarting} onStart={handleStartEvaluation} />
        </View>
      ) : null}

      {showContext && !conflictMessage ? (
        <EvaluationContextCard
          assignedEvaluatorName={occurrence.assignedEvaluatorName}
          conditionDescription={occurrence.conditionDescription}
          immediateActionDescription={occurrence.immediateActionDescription}
        />
      ) : null}

      {showRecord && !conflictMessage ? (
        <VerEAgirPanel
          isOnline={isOnline}
          isSubmitting={isRecording}
          latestCommentBody={latestCommentBody}
          onSubmit={handleRecordDecision}
        />
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
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    paddingTop: 12,
    textTransform: "uppercase",
  },
  stack: {
    gap: 12,
  },
});

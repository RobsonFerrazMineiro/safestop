import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { OccurrenceDetails } from "@safestop/types";

import { useAuthorization } from "@/features/authorization/hooks/use-authorization";
import { EvaluationConflictCard } from "@/features/ver-e-agir/components/evaluation-conflict-card";
import { EvaluationMutationError } from "@/features/ver-e-agir/utils/evaluation-errors";

import { InterdicaoDecisionCard } from "./interdicao-decision-card";
import { InterdicaoSummary } from "./interdicao-summary";
import { useRecordInterdicaoDecision } from "../hooks";
import {
  canConfirmInterdiction,
  shouldShowInterdicaoSummary,
} from "../utils/interdicao-permissions";

type InterdicaoSectionProps = {
  occurrence: OccurrenceDetails;
  isOnline: boolean;
  isRefreshing?: boolean;
  onRefresh: () => Promise<unknown>;
};

export function InterdicaoSection({
  occurrence,
  isOnline,
  isRefreshing = false,
  onRefresh,
}: InterdicaoSectionProps) {
  const { can, isPlatformAdmin } = useAuthorization();
  const canConfirm = can("occurrence.confirm_interdiction");
  const canRead = can("occurrence.read");

  const { recordDecision, isRecording } = useRecordInterdicaoDecision(occurrence.id);

  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [alreadyDecidedMessage, setAlreadyDecidedMessage] = useState<string | null>(null);

  const showSummary = shouldShowInterdicaoSummary(occurrence.status, occurrence.decision);
  const showForm = canConfirmInterdiction({
    canConfirm,
    isPlatformAdmin,
    status: occurrence.status,
    occurrence,
  });

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

  async function handleRecordDecision(decisionReason: string) {
    try {
      await recordDecision(decisionReason);
      setConflictMessage(null);
      setAlreadyDecidedMessage(null);
    } catch (error) {
      await handleMutationConflict(error, "Não foi possível confirmar a Interdição Oficial.");
      throw error;
    }
  }

  if (!canRead) {
    return null;
  }

  if (!showSummary && !showForm && !conflictMessage && !alreadyDecidedMessage) {
    return null;
  }

  return (
    <View style={styles.container}>
      {showSummary ? (
        <>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Decisão
          </Text>
          {occurrence.decision ? <InterdicaoSummary decision={occurrence.decision} /> : null}
        </>
      ) : null}

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

      {showForm && !conflictMessage && !alreadyDecidedMessage ? (
        <InterdicaoDecisionCard
          isOnline={isOnline}
          isSubmitting={isRecording}
          onSubmit={handleRecordDecision}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionTitle: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});

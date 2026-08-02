import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { MdhoCatalogCategory } from "@safestop/types";
import { MDHO_RETURN_REASON_MAX_LENGTH, MDHO_RETURN_REASON_MIN_LENGTH } from "@safestop/types";

import { formatOccurrenceDate } from "@/features/occurrences/utils/occurrence-labels";

import type { MdhoAssessmentEnriched } from "../services/map-mdho";
import { MdhoReadOnlyView } from "./mdho-read-only-view";

type MdhoReviewPanelProps = {
  assessment: MdhoAssessmentEnriched;
  catalog: MdhoCatalogCategory[];
  canApprove: boolean;
  canReturn: boolean;
  isOnline: boolean;
  isApproving: boolean;
  isReturning: boolean;
  onApprove: () => Promise<void>;
  onReturn: (returnReason: string) => Promise<void>;
};

export function MdhoReviewPanel({
  assessment,
  catalog,
  canApprove,
  canReturn,
  isOnline,
  isApproving,
  isReturning,
  onApprove,
  onReturn,
}: MdhoReviewPanelProps) {
  const [returnReason, setReturnReason] = useState("");
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnError, setReturnError] = useState<string | null>(null);

  const trimmedReason = returnReason.trim();
  const canSubmitReturn =
    isOnline &&
    !isReturning &&
    trimmedReason.length >= MDHO_RETURN_REASON_MIN_LENGTH &&
    trimmedReason.length <= MDHO_RETURN_REASON_MAX_LENGTH;

  function confirmApprove() {
    Alert.alert("Aprovar Avaliação Técnica (MDHO)?", "A avaliação ficará imutável.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Aprovar MDHO",
        onPress: () => {
          void onApprove();
        },
      },
    ]);
  }

  function confirmReturn() {
    if (!canSubmitReturn) {
      setReturnError("Informe um motivo com pelo menos 10 caracteres.");
      return;
    }

    Alert.alert("Devolver Avaliação Técnica (MDHO)?", undefined, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Devolver MDHO",
        style: "destructive",
        onPress: () => {
          void onReturn(trimmedReason);
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.status}>Aguardando aprovação HSE</Text>

      <MdhoReadOnlyView assessment={assessment} catalog={catalog} />

      <View style={styles.metaRow}>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Enviado por</Text>
          <Text style={styles.metaValue}>{assessment.submittedByName ?? "—"}</Text>
        </View>
        <View style={styles.metaField}>
          <Text style={styles.metaLabel}>Em</Text>
          <Text style={styles.metaValue}>
            {assessment.submittedAt ? formatOccurrenceDate(assessment.submittedAt) : "—"}
          </Text>
        </View>
      </View>

      {!isOnline ? (
        <Text style={styles.offline}>Conecte-se para continuar a Avaliação Técnica (MDHO).</Text>
      ) : null}

      {canReturn || canApprove ? (
        <View style={styles.actions}>
          {canReturn ? (
            <>
              {showReturnForm ? (
                <View style={styles.returnForm}>
                  <Text style={styles.returnLabel}>Motivo da devolução</Text>
                  <TextInput
                    accessibilityLabel="Motivo da devolução do MDHO"
                    editable={!isReturning && isOnline}
                    multiline
                    placeholder="Descreva o motivo..."
                    placeholderTextColor="#6B7280"
                    style={styles.returnInput}
                    value={returnReason}
                    onChangeText={(value) => {
                      setReturnReason(value);
                      setReturnError(null);
                    }}
                  />
                  {returnError ? <Text style={styles.error}>{returnError}</Text> : null}
                  <Pressable
                    accessibilityLabel="Confirmar devolução do MDHO"
                    accessibilityRole="button"
                    disabled={!canSubmitReturn}
                    style={({ pressed }) => [
                      styles.returnButton,
                      !canSubmitReturn && styles.buttonDisabled,
                      pressed && canSubmitReturn && styles.pressed,
                    ]}
                    onPress={confirmReturn}
                  >
                    {isReturning ? (
                      <ActivityIndicator color="#FEE2E2" size="small" />
                    ) : (
                      <Text style={styles.returnButtonText}>Devolver MDHO</Text>
                    )}
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  accessibilityLabel="Devolver MDHO"
                  accessibilityRole="button"
                  disabled={!isOnline || isApproving || isReturning}
                  style={({ pressed }) => [styles.returnOutlineButton, pressed && styles.pressed]}
                  onPress={() => {
                    setShowReturnForm(true);
                  }}
                >
                  <Text style={styles.returnOutlineText}>Devolver MDHO</Text>
                </Pressable>
              )}
            </>
          ) : null}

          {canApprove ? (
            <Pressable
              accessibilityLabel={isApproving ? "Aprovando MDHO" : "Aprovar MDHO"}
              accessibilityRole="button"
              disabled={!isOnline || isApproving || isReturning}
              style={({ pressed }) => [
                styles.approveButton,
                (!isOnline || isApproving || isReturning) && styles.buttonDisabled,
                pressed && isOnline && !isApproving && !isReturning && styles.pressed,
              ]}
              onPress={confirmApprove}
            >
              {isApproving ? (
                <ActivityIndicator color="#EFF6FF" size="small" />
              ) : (
                <Text style={styles.approveText}>Aprovar MDHO</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  approveButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  approveText: {
    color: "#EFF6FF",
    fontSize: 15,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  container: {
    gap: 12,
  },
  error: {
    color: "#F87171",
    fontSize: 13,
  },
  metaField: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaValue: {
    color: "#F9FAFB",
    fontSize: 15,
  },
  offline: {
    color: "#93C5FD",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
  returnButton: {
    alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
  },
  returnButtonText: {
    color: "#FEE2E2",
    fontSize: 14,
    fontWeight: "700",
  },
  returnForm: {
    gap: 8,
  },
  returnInput: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 15,
    maxHeight: 120,
    minHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  returnLabel: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "600",
  },
  returnOutlineButton: {
    alignItems: "center",
    borderColor: "#DC2626",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  returnOutlineText: {
    color: "#FCA5A5",
    fontSize: 15,
    fontWeight: "700",
  },
  status: {
    color: "#93C5FD",
    fontSize: 14,
    fontWeight: "600",
  },
});

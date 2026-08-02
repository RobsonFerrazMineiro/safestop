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
import {
  OCCURRENCE_DECISION_REASON_MAX_LENGTH,
  OCCURRENCE_DECISION_REASON_MIN_LENGTH,
} from "@safestop/types";

type InterdicaoDecisionCardProps = {
  isOnline: boolean;
  isSubmitting: boolean;
  onSubmit: (decisionReason: string) => Promise<void>;
};

export function InterdicaoDecisionCard({
  isOnline,
  isSubmitting,
  onSubmit,
}: InterdicaoDecisionCardProps) {
  const [decisionReason, setDecisionReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const trimmed = decisionReason.trim();
  const canSubmit =
    isOnline &&
    !isSubmitting &&
    trimmed.length >= OCCURRENCE_DECISION_REASON_MIN_LENGTH &&
    trimmed.length <= OCCURRENCE_DECISION_REASON_MAX_LENGTH;

  const helperText = !isOnline
    ? "Conecte-se para confirmar a Interdição Oficial."
    : trimmed.length > 0 && trimmed.length < OCCURRENCE_DECISION_REASON_MIN_LENGTH
      ? "Mínimo 10 caracteres"
      : null;

  function confirmSubmit() {
    if (!canSubmit) {
      if (trimmed.length < OCCURRENCE_DECISION_REASON_MIN_LENGTH) {
        setValidationError("Informe uma justificativa técnica com pelo menos 10 caracteres.");
      }
      return;
    }

    Alert.alert(
      "Confirmar Interdição Oficial?",
      "A atividade permanecerá formalmente interditada. Esta decisão não pode ser desfeita nesta etapa.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar interdição",
          style: "destructive",
          onPress: () => {
            void handleSubmit();
          },
        },
      ],
    );
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    setValidationError(null);
    setSubmitError(null);

    try {
      await onSubmit(trimmed);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Não foi possível confirmar a Interdição Oficial.",
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.cardTitle}>Interdição Oficial</Text>
        <Text style={styles.cardSubtitle}>Manter atividade formalmente interditada</Text>
      </View>

      <Text style={styles.label}>Justificativa técnica</Text>
      <TextInput
        accessibilityLabel="Justificativa técnica da Interdição Oficial"
        editable={!isSubmitting && isOnline}
        multiline
        placeholder="Descreva a justificativa técnica..."
        placeholderTextColor="#6B7280"
        style={[styles.input, validationError ? styles.inputError : null]}
        value={decisionReason}
        onChangeText={(value) => {
          setDecisionReason(value);
          setValidationError(null);
          setSubmitError(null);
        }}
      />

      {validationError ? <Text style={styles.error}>{validationError}</Text> : null}
      {submitError ? <Text style={styles.error}>{submitError}</Text> : null}
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}

      <Text style={styles.counter}>
        {trimmed.length}/{OCCURRENCE_DECISION_REASON_MAX_LENGTH}
      </Text>

      <Pressable
        accessibilityLabel={isSubmitting ? "Confirmando interdição" : "Confirmar interdição"}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit, busy: isSubmitting }}
        disabled={!canSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          !canSubmit && styles.submitButtonDisabled,
          pressed && canSubmit && styles.pressed,
        ]}
        onPress={confirmSubmit}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FEE2E2" size="small" />
        ) : (
          <Text style={styles.submitText}>Confirmar interdição</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#450A0A",
    borderColor: "#DC2626",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 16,
  },
  cardSubtitle: {
    color: "#FCA5A5",
    fontSize: 14,
  },
  cardTitle: {
    color: "#FECACA",
    fontSize: 16,
    fontWeight: "700",
  },
  container: {
    gap: 10,
  },
  counter: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "right",
  },
  error: {
    color: "#F87171",
    fontSize: 13,
  },
  helper: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  input: {
    backgroundColor: "#1F2937",
    borderColor: "#374151",
    borderRadius: 12,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 15,
    maxHeight: 160,
    minHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputError: {
    borderColor: "#F87171",
  },
  label: {
    color: "#D1D5DB",
    fontSize: 13,
    fontWeight: "600",
  },
  lockIcon: {
    fontSize: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: "#FEE2E2",
    fontSize: 15,
    fontWeight: "700",
  },
});

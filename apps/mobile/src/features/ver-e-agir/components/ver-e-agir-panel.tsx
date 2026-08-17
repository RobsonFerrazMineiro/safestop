import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  OCCURRENCE_DECISION_REASON_MAX_LENGTH,
  OCCURRENCE_DECISION_REASON_MIN_LENGTH,
} from "@safestop/types";

import { confirmAction } from "@/lib/confirm-action";

type VerEAgirPanelProps = {
  isOnline: boolean;
  isSubmitting: boolean;
  latestCommentBody?: string | null;
  onSubmit: (decisionReason: string) => Promise<void>;
};

export function VerEAgirPanel({
  isOnline,
  isSubmitting,
  latestCommentBody,
  onSubmit,
}: VerEAgirPanelProps) {
  const [decisionReason, setDecisionReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const trimmed = decisionReason.trim();
  const isFormValid =
    !isSubmitting &&
    trimmed.length >= OCCURRENCE_DECISION_REASON_MIN_LENGTH &&
    trimmed.length <= OCCURRENCE_DECISION_REASON_MAX_LENGTH;

  const helperText = !isOnline
    ? "Você está offline. Conecte-se para registrar a decisão."
    : trimmed.length > 0 && trimmed.length < OCCURRENCE_DECISION_REASON_MIN_LENGTH
      ? "Mínimo 10 caracteres"
      : null;

  async function applyCommentDraft() {
    if (!latestCommentBody?.trim()) {
      return;
    }

    const apply = () => {
      setDecisionReason(latestCommentBody.trim());
      setValidationError(null);
      setSubmitError(null);
    };

    if (decisionReason.trim().length > 0) {
      const confirmed = await confirmAction({
        title: "Substituir o texto da justificativa?",
        message: "O texto atual será substituído pelo comentário.",
        confirmLabel: "Substituir",
      });

      if (!confirmed) {
        return;
      }
    }

    apply();
  }

  async function confirmSubmit() {
    if (!isFormValid) {
      if (trimmed.length < OCCURRENCE_DECISION_REASON_MIN_LENGTH) {
        setValidationError("Informe uma justificativa com pelo menos 10 caracteres.");
      }
      return;
    }

    if (!isOnline) {
      setSubmitError("Você está offline. Conecte-se para registrar a decisão.");
      return;
    }

    const confirmed = await confirmAction({
      title: "Registrar decisão Ver e Agir?",
      message: "Esta ação não pode ser desfeita nesta etapa.",
      confirmLabel: "Registrar Ver e Agir",
    });

    if (confirmed) {
      await handleSubmit();
    }
  }

  async function handleSubmit() {
    if (!isFormValid || !isOnline) {
      return;
    }

    setValidationError(null);
    setSubmitError(null);

    try {
      await onSubmit(trimmed);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Não foi possível registrar a decisão.",
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ver e Agir</Text>
        <Text style={styles.cardSubtitle}>Resolução imediata no campo</Text>
      </View>

      <Text style={styles.label}>Justificativa</Text>
      <TextInput
        accessibilityLabel="Justificativa da decisão Ver e Agir"
        editable={!isSubmitting}
        multiline
        placeholder="Descreva a justificativa da decisão..."
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

      {latestCommentBody?.trim() ? (
        <Pressable
          accessibilityLabel="Usar comentário como rascunho"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            void applyCommentDraft();
          }}
        >
          <Text style={styles.draftLink}>Usar comentário como rascunho</Text>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityLabel={isSubmitting ? "Registrando decisão" : "Registrar Ver e Agir"}
        accessibilityRole="button"
        accessibilityState={{ disabled: !isFormValid, busy: isSubmitting }}
        disabled={!isFormValid}
        style={({ pressed }) => [
          styles.submitButton,
          !isFormValid && styles.submitButtonDisabled,
          pressed && isFormValid && styles.pressed,
        ]}
        onPress={() => {
          void confirmSubmit();
        }}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#0F1115" size="small" />
        ) : (
          <Text style={styles.submitText}>Registrar Ver e Agir</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1F2937",
    borderColor: "#F59E0B",
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 16,
  },
  cardSubtitle: {
    color: "#FDE68A",
    fontSize: 14,
  },
  cardTitle: {
    color: "#FBBF24",
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
  draftLink: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "600",
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
  pressed: {
    opacity: 0.85,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: "#0F1115",
    fontSize: 15,
    fontWeight: "700",
  },
});

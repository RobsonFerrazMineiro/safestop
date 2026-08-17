import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MdhoDraftBarProps = {
  isOnline: boolean;
  canSubmit: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  draftMessage?: string | null;
  onSaveDraft: () => void;
  onSubmit: () => void;
};

export function MdhoDraftBar({
  isOnline,
  canSubmit,
  isSaving,
  isSubmitting,
  draftMessage,
  onSaveDraft,
  onSubmit,
}: MdhoDraftBarProps) {
  const insets = useSafeAreaInsets();
  const isBusy = isSaving || isSubmitting;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {!isOnline ? (
        <Text style={styles.offline}>Conecte-se para continuar a Avaliação Técnica (MDHO).</Text>
      ) : null}
      {draftMessage ? <Text style={styles.feedback}>{draftMessage}</Text> : null}

      <View style={styles.row}>
        <Pressable
          accessibilityLabel={isSaving ? "Salvando rascunho" : "Salvar rascunho"}
          accessibilityRole="button"
          accessibilityState={{ disabled: isBusy, busy: isSaving }}
          disabled={isBusy}
          style={({ pressed }) => [
            styles.saveButton,
            isBusy && styles.buttonDisabled,
            pressed && !isBusy && styles.pressed,
          ]}
          onPress={onSaveDraft}
        >
          {isSaving ? (
            <ActivityIndicator color="#F9FAFB" size="small" />
          ) : (
            <Text style={styles.saveText}>Salvar rascunho</Text>
          )}
        </Pressable>

        {canSubmit ? (
          <Pressable
            accessibilityLabel={isSubmitting ? "Enviando MDHO" : "Enviar MDHO"}
            accessibilityRole="button"
            accessibilityState={{ disabled: isBusy, busy: isSubmitting }}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.submitButton,
              isBusy && styles.buttonDisabled,
              pressed && !isBusy && styles.pressed,
            ]}
            onPress={onSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#EFF6FF" size="small" />
            ) : (
              <Text style={styles.submitText}>Enviar MDHO</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonDisabled: {
    opacity: 0.5,
  },
  container: {
    backgroundColor: "#0F1115",
    borderTopColor: "#1F2937",
    borderTopWidth: 1,
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  feedback: {
    color: "#86EFAC",
    fontSize: 13,
  },
  offline: {
    color: "#93C5FD",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  saveButton: {
    alignItems: "center",
    borderColor: "#374151",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  saveText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  submitText: {
    color: "#EFF6FF",
    fontSize: 14,
    fontWeight: "700",
  },
});

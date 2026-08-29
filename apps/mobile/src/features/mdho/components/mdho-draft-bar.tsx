import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, statusChip, typography } from "@safestop/ui";

import { Button } from "@/components/ui";

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
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing[3]) }]}>
      {!isOnline ? (
        <Text style={styles.offline}>Conecte-se para continuar a Avaliação Técnica (MDHO).</Text>
      ) : null}
      {draftMessage ? <Text style={styles.feedback}>{draftMessage}</Text> : null}

      <View style={styles.row}>
        <Button
          accessibilityLabel={isSaving ? "Salvando rascunho" : "Salvar rascunho"}
          disabled={isBusy}
          loading={isSaving}
          style={styles.saveButton}
          variant="secondary"
          onPress={onSaveDraft}
        >
          Salvar rascunho
        </Button>

        {canSubmit ? (
          <Button
            accessibilityLabel={isSubmitting ? "Enviando MDHO" : "Enviar MDHO"}
            disabled={isBusy}
            loading={isSubmitting}
            style={styles.submitButton}
            variant="secondary"
            onPress={onSubmit}
          >
            Enviar MDHO
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
  },
  feedback: {
    color: statusChip.success.foreground,
    fontSize: typography.helper.fontSize,
  },
  offline: {
    color: statusChip.info.foreground,
    fontSize: typography.helper.fontSize,
  },
  row: {
    flexDirection: "row",
    gap: spacing[2],
  },
  saveButton: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.info,
    borderColor: colors.info,
    flex: 1,
  },
});

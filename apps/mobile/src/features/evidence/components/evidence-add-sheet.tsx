import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, overlay, radius, spacing, typography } from "@safestop/ui";

import { Button } from "@/components/ui";

type EvidenceAddSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPickCamera: () => void;
  onPickLibrary: () => void;
  onPickPdf: () => void;
  isBusy?: boolean;
};

export function EvidenceAddSheet({
  visible,
  onClose,
  onPickCamera,
  onPickLibrary,
  onPickPdf,
  isBusy,
}: EvidenceAddSheetProps) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable accessibilityLabel="Fechar" style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />

          <Text style={styles.title}>Adicionar evidência</Text>
          <Text style={styles.hint}>JPG, PNG, WebP ou PDF · máx. 10 MiB</Text>

          <Button
            accessibilityLabel="Tirar foto"
            disabled={isBusy}
            variant="secondary"
            onPress={onPickCamera}
          >
            Tirar foto
          </Button>

          <Button
            accessibilityLabel="Escolher imagem"
            disabled={isBusy}
            variant="secondary"
            onPress={onPickLibrary}
          >
            Escolher imagem
          </Button>

          <Button
            accessibilityLabel="Escolher PDF"
            disabled={isBusy}
            variant="secondary"
            onPress={onPickPdf}
          >
            Escolher PDF
          </Button>

          <Button accessibilityLabel="Cancelar" variant="ghost" onPress={onClose}>
            Cancelar
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: overlay.scrim,
    flex: 1,
    justifyContent: "flex-end",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: spacing[4],
    width: 40,
  },
  hint: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
    marginBottom: spacing[1],
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.dialog,
    borderTopRightRadius: radius.dialog,
    gap: spacing[3],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
  },
  title: {
    color: colors.foreground,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: typography.cardTitle.fontWeight,
    marginBottom: spacing[1],
  },
});

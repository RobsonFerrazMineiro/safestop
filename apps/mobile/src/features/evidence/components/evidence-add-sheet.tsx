import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, overlay, radius, spacing, typography } from "@safestop/ui";

import { Button } from "@/components/ui";

type EvidenceAddSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPickCamera: () => void;
  onPickLibrary: () => void;
  isBusy?: boolean;
};

export function EvidenceAddSheet({
  visible,
  onClose,
  onPickCamera,
  onPickLibrary,
  isBusy,
}: EvidenceAddSheetProps) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable accessibilityLabel="Fechar" style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.handle} />

          <Text style={styles.title}>Adicionar evidência</Text>

          <Button
            accessibilityLabel="Tirar foto"
            disabled={isBusy}
            variant="secondary"
            onPress={onPickCamera}
          >
            Tirar foto
          </Button>

          <Button
            accessibilityLabel="Escolher da galeria"
            disabled={isBusy}
            variant="secondary"
            onPress={onPickLibrary}
          >
            Escolher da galeria
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

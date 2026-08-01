import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { evidenceColors } from "../theme/colors";

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

          <Pressable
            accessibilityLabel="Tirar foto"
            accessibilityRole="button"
            disabled={isBusy}
            style={({ pressed }) => [styles.action, pressed && !isBusy && styles.pressed]}
            onPress={onPickCamera}
          >
            <Text style={styles.actionText}>Tirar foto</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Escolher da galeria"
            accessibilityRole="button"
            disabled={isBusy}
            style={({ pressed }) => [styles.action, pressed && !isBusy && styles.pressed]}
            onPress={onPickLibrary}
          >
            <Text style={styles.actionText}>Escolher da galeria</Text>
          </Pressable>

          <Pressable
            accessibilityLabel="Cancelar"
            accessibilityRole="button"
            style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    backgroundColor: evidenceColors.surface,
    borderColor: evidenceColors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 16,
  },
  actionText: {
    color: evidenceColors.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  backdrop: {
    backgroundColor: evidenceColors.overlay,
    flex: 1,
    justifyContent: "flex-end",
  },
  cancel: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    marginTop: 8,
  },
  cancelText: {
    color: evidenceColors.foregroundMuted,
    fontSize: 15,
    fontWeight: "600",
  },
  handle: {
    alignSelf: "center",
    backgroundColor: evidenceColors.border,
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    width: 40,
  },
  pressed: {
    opacity: 0.85,
  },
  sheet: {
    backgroundColor: evidenceColors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    color: evidenceColors.foreground,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
});

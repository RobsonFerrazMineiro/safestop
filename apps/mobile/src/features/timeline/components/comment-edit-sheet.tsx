import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors } from "@safestop/ui";
import { OCCURRENCE_COMMENT_MAX_LENGTH } from "@safestop/types";

type CommentEditSheetFormProps = {
  initialContent: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
};

function CommentEditSheetForm({
  initialContent,
  isSaving,
  onClose,
  onSave,
}: CommentEditSheetFormProps) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);

  const trimmed = content.trim();
  const canSave =
    trimmed.length > 0 && trimmed.length <= OCCURRENCE_COMMENT_MAX_LENGTH && !isSaving;

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setError(null);

    try {
      await onSave(trimmed);
      onClose();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Não foi possível salvar o comentário.",
      );
    }
  }

  return (
    <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
      <View style={styles.handle} />
      <Text style={styles.title}>Editar comentário</Text>

      <TextInput
        accessibilityLabel="Conteúdo do comentário"
        editable={!isSaving}
        multiline
        placeholder="Adicionar comentário..."
        placeholderTextColor="#6B7280"
        style={styles.input}
        value={content}
        onChangeText={setContent}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Cancelar edição"
          accessibilityRole="button"
          disabled={isSaving}
          style={({ pressed }) => [styles.cancelButton, pressed && !isSaving && styles.pressed]}
          onPress={onClose}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>

        <Pressable
          accessibilityLabel={isSaving ? "Salvando comentário" : "Salvar comentário"}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave, busy: isSaving }}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.saveButton,
            !canSave && styles.saveButtonDisabled,
            pressed && canSave && styles.pressed,
          ]}
          onPress={() => {
            void handleSave();
          }}
        >
          {isSaving ? (
            <ActivityIndicator color="#0F1115" size="small" />
          ) : (
            <Text style={styles.saveText}>Salvar</Text>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

type CommentEditSheetProps = {
  visible: boolean;
  initialContent: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
};

export function CommentEditSheet({
  visible,
  initialContent,
  isSaving,
  onClose,
  onSave,
}: CommentEditSheetProps) {
  if (!visible) {
    return null;
  }

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <Pressable accessibilityLabel="Fechar edição" style={styles.backdrop} onPress={onClose}>
        <CommentEditSheetForm
          key={initialContent}
          initialContent={initialContent}
          isSaving={isSaving}
          onClose={onClose}
          onSave={onSave}
        />
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "flex-end",
  },
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    flex: 1,
    justifyContent: "flex-end",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "600",
  },
  error: {
    color: "#F87171",
    fontSize: 13,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: "#374151",
    borderRadius: 999,
    height: 4,
    marginBottom: 16,
    width: 40,
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
  pressed: {
    opacity: 0.85,
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: 16,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  sheet: {
    backgroundColor: "#0F1115",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  title: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "700",
  },
});

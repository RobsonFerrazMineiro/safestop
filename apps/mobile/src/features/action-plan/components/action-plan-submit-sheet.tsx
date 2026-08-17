import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import type { ActionItemPriority } from "@safestop/types";
import { submitActionItemSchema } from "@safestop/validation";

import { EvidenceAddSheet } from "@/features/evidence/components/evidence-add-sheet";

import { useActionItemAttachments, useUploadActionItemEvidence } from "../hooks";
import { ACTION_ITEM_ATTACHMENT_MAX_COUNT } from "../types";
import { ACTION_PLAN_COPY } from "../utils/action-plan-copy";

type ActionPlanSubmitSheetProps = {
  visible: boolean;
  itemId: string;
  occurrenceId: string;
  priority: ActionItemPriority;
  isOnline: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (completionDescription: string) => Promise<void>;
};

function requiresEvidence(priority: ActionItemPriority): boolean {
  return priority === "HIGH" || priority === "CRITICAL";
}

export function ActionPlanSubmitSheet({
  visible,
  itemId,
  occurrenceId,
  priority,
  isOnline,
  isSubmitting,
  onClose,
  onSubmit,
}: ActionPlanSubmitSheetProps) {
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { attachments, completedCount, refetch } = useActionItemAttachments(
    visible ? itemId : null,
  );

  const { pickFromCamera, pickFromLibrary, isUploading } = useUploadActionItemEvidence({
    occurrenceId,
    itemId,
    completedCount,
  });

  const evidenceRequired = requiresEvidence(priority);

  async function handleSend() {
    const parsed = submitActionItemSchema.safeParse({
      itemId,
      completionDescription: description,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Verifique os dados.");
      return;
    }

    if (evidenceRequired && completedCount < 1) {
      setValidationError(ACTION_PLAN_COPY.evidenceRequiredError);
      return;
    }

    setValidationError(null);
    await onSubmit(parsed.data.completionDescription ?? "");
    setDescription("");
    onClose();
  }

  async function handlePick(from: "camera" | "library") {
    if (!isOnline) {
      setUploadError(ACTION_PLAN_COPY.offline);
      return;
    }

    try {
      setUploadError(null);
      if (from === "camera") {
        await pickFromCamera();
      } else {
        await pickFromLibrary();
      }
      await refetch();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Falha no upload.");
    }
  }

  return (
    <>
      <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
        <Pressable accessibilityLabel="Fechar" style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <ScrollView contentContainerStyle={styles.content}>
              <Text style={styles.title}>{ACTION_PLAN_COPY.submitTitle}</Text>

              <Text style={styles.label}>{ACTION_PLAN_COPY.completionLabel}</Text>
              <TextInput
                editable={isOnline && !isSubmitting}
                multiline
                placeholder="Descreva o que foi feito"
                placeholderTextColor="#6B7280"
                style={styles.textarea}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.label}>{ACTION_PLAN_COPY.evidenceLabel}</Text>
              <Text style={styles.hint}>
                {evidenceRequired
                  ? ACTION_PLAN_COPY.evidenceRequired
                  : ACTION_PLAN_COPY.evidenceOptional}
              </Text>
              <Text style={styles.counter}>
                {ACTION_PLAN_COPY.evidenceLimit(completedCount, ACTION_ITEM_ATTACHMENT_MAX_COUNT)}
              </Text>

              {attachments.length > 0 ? (
                <Text style={styles.attachments}>
                  {attachments.filter((a) => a.uploadStatus === "COMPLETED").length} evidência(s)
                  anexada(s)
                </Text>
              ) : null}

              <Pressable
                accessibilityLabel={ACTION_PLAN_COPY.addEvidence}
                accessibilityRole="button"
                disabled={!isOnline || isUploading || isSubmitting}
                style={[styles.addEvidenceButton, (!isOnline || isUploading) && styles.disabled]}
                onPress={() => {
                  setShowAddSheet(true);
                }}
              >
                {isUploading ? (
                  <ActivityIndicator color="#DBEAFE" />
                ) : (
                  <Text style={styles.addEvidenceText}>{ACTION_PLAN_COPY.addEvidence}</Text>
                )}
              </Pressable>

              {uploadError ? <Text style={styles.error}>{uploadError}</Text> : null}
              {validationError ? <Text style={styles.error}>{validationError}</Text> : null}

              <Pressable
                accessibilityLabel={ACTION_PLAN_COPY.submitSend}
                accessibilityRole="button"
                disabled={!isOnline || isSubmitting || isUploading}
                style={[styles.sendButton, (!isOnline || isSubmitting) && styles.disabled]}
                onPress={() => {
                  void handleSend();
                }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#EFF6FF" />
                ) : (
                  <Text style={styles.sendButtonText}>{ACTION_PLAN_COPY.submitSend}</Text>
                )}
              </Pressable>

              <Pressable accessibilityRole="button" style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>{ACTION_PLAN_COPY.cancel}</Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <EvidenceAddSheet
        isBusy={isUploading}
        visible={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
        }}
        onPickCamera={() => {
          setShowAddSheet(false);
          void handlePick("camera");
        }}
        onPickLibrary={() => {
          setShowAddSheet(false);
          void handlePick("library");
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  addEvidenceButton: {
    alignItems: "center",
    backgroundColor: "#1E3A5F",
    borderColor: "#2563EB",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
  },
  addEvidenceText: {
    color: "#DBEAFE",
    fontSize: 15,
    fontWeight: "700",
  },
  attachments: {
    color: "#86EFAC",
    fontSize: 13,
  },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.55)",
    flex: 1,
    justifyContent: "flex-end",
  },
  cancelButton: {
    alignItems: "center",
    marginTop: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  cancelText: {
    color: "#9CA3AF",
    fontSize: 15,
    fontWeight: "600",
  },
  content: {
    gap: 10,
    paddingBottom: 24,
  },
  counter: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  disabled: {
    opacity: 0.45,
  },
  error: {
    color: "#FCA5A5",
    fontSize: 13,
  },
  hint: {
    color: "#9CA3AF",
    fontSize: 13,
  },
  label: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#2563EB",
    borderRadius: 10,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 48,
  },
  sendButtonText: {
    color: "#EFF6FF",
    fontSize: 16,
    fontWeight: "700",
  },
  sheet: {
    backgroundColor: "#0B1220",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  textarea: {
    backgroundColor: "#111827",
    borderColor: "#374151",
    borderRadius: 10,
    borderWidth: 1,
    color: "#F9FAFB",
    fontSize: 15,
    minHeight: 96,
    padding: 12,
    textAlignVertical: "top",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
});

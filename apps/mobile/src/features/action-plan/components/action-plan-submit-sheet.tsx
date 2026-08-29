import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import type { ActionItemPriority } from "@safestop/types";
import { submitActionItemSchema } from "@safestop/validation";
import { colors, overlay, radius, spacing, statusChip, typography } from "@safestop/ui";

import { Button, TextField } from "@/components/ui";
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

              <TextField
                disabled={!isOnline || isSubmitting}
                label={ACTION_PLAN_COPY.completionLabel}
                multiline
                placeholder="Descreva o que foi feito"
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

              <Button
                accessibilityLabel={ACTION_PLAN_COPY.addEvidence}
                disabled={!isOnline || isUploading || isSubmitting}
                loading={isUploading}
                variant="secondary"
                onPress={() => {
                  setShowAddSheet(true);
                }}
              >
                {ACTION_PLAN_COPY.addEvidence}
              </Button>

              {uploadError ? <Text style={styles.error}>{uploadError}</Text> : null}
              {validationError ? <Text style={styles.error}>{validationError}</Text> : null}

              <Button
                accessibilityLabel={ACTION_PLAN_COPY.submitSend}
                disabled={!isOnline || isSubmitting || isUploading}
                loading={isSubmitting}
                onPress={() => {
                  void handleSend();
                }}
              >
                {ACTION_PLAN_COPY.submitSend}
              </Button>

              <Button accessibilityRole="button" variant="ghost" onPress={onClose}>
                {ACTION_PLAN_COPY.cancel}
              </Button>
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
  attachments: {
    color: statusChip.success.foreground,
    fontSize: typography.caption.fontSize,
  },
  backdrop: {
    backgroundColor: overlay.scrim,
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    gap: spacing[2],
    paddingBottom: spacing[6],
  },
  counter: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
  },
  error: {
    color: colors.destructive,
    fontSize: typography.caption.fontSize,
  },
  hint: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
  },
  label: {
    color: statusChip.info.foreground,
    fontSize: typography.caption.fontSize,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.dialog,
    borderTopRightRadius: radius.dialog,
    maxHeight: "85%",
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
  },
  title: {
    color: colors.foreground,
    fontSize: typography.cardTitle.fontSize,
    fontWeight: "700",
    marginBottom: spacing[1],
  },
});

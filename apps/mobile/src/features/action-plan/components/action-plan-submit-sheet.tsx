import { useState } from "react";
import { FileText } from "lucide-react-native";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ActionItemPriority } from "@safestop/types";
import { submitActionItemSchema } from "@safestop/validation";
import { colors, overlay, radius, spacing, statusChip, typography } from "@safestop/ui";

import { Button, TextField } from "@/components/ui";
import { EvidenceAddSheet } from "@/features/evidence/components/evidence-add-sheet";
import { isEvidencePdfMimeType } from "@/features/evidence/utils/is-evidence-mime";
import { openEvidenceSignedUrl } from "@/features/evidence/utils/open-evidence-signed-url";

import { useActionItemAttachments, useUploadActionItemEvidence } from "../hooks";
import { getActionItemAttachmentSignedUrl } from "../services/get-action-item-attachment-signed-url";
import { ACTION_ITEM_ATTACHMENT_MAX_COUNT } from "../types";
import { ACTION_PLAN_COPY } from "../utils/action-plan-copy";
import {
  formatEvidenceCounter,
  getActionItemEvidenceSubmitError,
  getAttachmentListRefreshError,
  requiresActionItemEvidence,
} from "../utils/action-plan-evidence-rules";

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
  const [openError, setOpenError] = useState<string | null>(null);

  const { attachments, completedCount, refetch } = useActionItemAttachments(
    visible ? itemId : null,
  );

  const { pickFromCamera, pickFromLibrary, pickFromPdf, isUploading } = useUploadActionItemEvidence(
    {
      occurrenceId,
      itemId,
      completedCount,
    },
  );

  const evidenceRequired = requiresActionItemEvidence(priority);
  const completedAttachments = attachments.filter((item) => item.uploadStatus === "COMPLETED");

  async function handleSend() {
    const parsed = submitActionItemSchema.safeParse({
      itemId,
      completionDescription: description,
    });

    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Verifique os dados.");
      return;
    }

    const evidenceError = getActionItemEvidenceSubmitError(priority, completedCount);

    if (evidenceError) {
      setValidationError(evidenceError);
      return;
    }

    setValidationError(null);
    await onSubmit(parsed.data.completionDescription ?? "");
    setDescription("");
    onClose();
  }

  async function handlePick(from: "camera" | "library" | "pdf") {
    if (!isOnline) {
      setUploadError(ACTION_PLAN_COPY.offline);
      setShowAddSheet(false);
      return;
    }

    try {
      setUploadError(null);
      setValidationError(null);

      const result =
        from === "camera"
          ? await pickFromCamera()
          : from === "library"
            ? await pickFromLibrary()
            : await pickFromPdf();

      setShowAddSheet(false);

      if (result === "canceled") {
        return;
      }

      const refreshed = await refetch();
      const listError = getAttachmentListRefreshError({
        error: refreshed.error
          ? refreshed.error instanceof Error
            ? refreshed.error
            : new Error("refresh_failed")
          : null,
      });

      if (listError) {
        setUploadError(listError);
      }
    } catch (error) {
      setShowAddSheet(false);
      setUploadError(error instanceof Error ? error.message : "Falha no upload.");
    }
  }

  async function handleOpenAttachment(attachmentId: string) {
    setOpenError(null);

    try {
      const url = await getActionItemAttachmentSignedUrl(attachmentId);
      await openEvidenceSignedUrl(url);
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : "Não foi possível abrir a evidência.");
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
                {formatEvidenceCounter(completedCount, ACTION_ITEM_ATTACHMENT_MAX_COUNT)}
              </Text>
              <Text style={styles.hint}>{ACTION_PLAN_COPY.evidenceFormats}</Text>

              {completedAttachments.length > 0 ? (
                <View style={styles.attachmentList}>
                  {completedAttachments.map((attachment) => {
                    const isPdf = isEvidencePdfMimeType(attachment.mimeType);

                    return (
                      <Pressable
                        key={attachment.id}
                        accessibilityLabel={
                          isPdf
                            ? `${ACTION_PLAN_COPY.openPdf} ${attachment.originalFileName}`
                            : `${ACTION_PLAN_COPY.openEvidence} ${attachment.originalFileName}`
                        }
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.attachmentRow,
                          pressed && styles.attachmentPressed,
                        ]}
                        onPress={() => {
                          void handleOpenAttachment(attachment.id);
                        }}
                      >
                        {isPdf ? (
                          <FileText accessible={false} color={colors.foregroundMuted} size={20} />
                        ) : (
                          <View style={styles.imageDot} />
                        )}
                        <View style={styles.attachmentMeta}>
                          <Text numberOfLines={1} style={styles.attachmentName}>
                            {attachment.originalFileName}
                          </Text>
                          <Text style={styles.attachmentKind}>
                            {isPdf ? "PDF · toque para abrir" : "Imagem · toque para abrir"}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
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
              {openError ? <Text style={styles.error}>{openError}</Text> : null}
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
          void handlePick("camera");
        }}
        onPickLibrary={() => {
          void handlePick("library");
        }}
        onPickPdf={() => {
          void handlePick("pdf");
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  attachmentKind: {
    color: colors.foregroundMuted,
    fontSize: typography.caption.fontSize,
  },
  attachmentList: {
    gap: spacing[2],
  },
  attachmentMeta: {
    flex: 1,
    gap: 2,
  },
  attachmentName: {
    color: colors.foreground,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },
  attachmentPressed: {
    opacity: 0.85,
  },
  attachmentRow: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
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
  imageDot: {
    backgroundColor: colors.foregroundMuted,
    borderRadius: 999,
    height: 10,
    width: 10,
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
